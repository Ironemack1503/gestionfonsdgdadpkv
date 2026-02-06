import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple password hashing using Web Crypto API (bcrypt-like approach)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordData = encoder.encode(password);
  
  // Combine salt and password
  const combined = new Uint8Array(salt.length + passwordData.length);
  combined.set(salt);
  combined.set(passwordData, salt.length);
  
  // Hash using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  const hashArray = new Uint8Array(hashBuffer);
  
  // Combine salt and hash for storage
  const result = new Uint8Array(salt.length + hashArray.length);
  result.set(salt);
  result.set(hashArray, salt.length);
  
  return base64Encode(result);
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const storedData = Uint8Array.from(atob(storedHash), c => c.charCodeAt(0));
    
    // Extract salt (first 16 bytes)
    const salt = storedData.slice(0, 16);
    const storedHashBytes = storedData.slice(16);
    
    // Hash the provided password with the same salt
    const passwordData = encoder.encode(password);
    const combined = new Uint8Array(salt.length + passwordData.length);
    combined.set(salt);
    combined.set(passwordData, salt.length);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
    const hashArray = new Uint8Array(hashBuffer);
    
    // Compare hashes
    if (hashArray.length !== storedHashBytes.length) return false;
    for (let i = 0; i < hashArray.length; i++) {
      if (hashArray[i] !== storedHashBytes[i]) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return base64Encode(bytes).replace(/[+/=]/g, '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { action, ...params } = await req.json();
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    switch (action) {
      case 'login': {
        const { username, password } = params;
        
        if (!username || !password) {
          return new Response(
            JSON.stringify({ error: 'Nom d\'utilisateur et mot de passe requis' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get user
        const { data: user, error: userError } = await supabase
          .from('local_users')
          .select('*')
          .eq('username', username.toLowerCase())
          .single();

        if (userError || !user) {
          // Log failed attempt
          await supabase.from('login_attempts').insert({
            username: username.toLowerCase(),
            success: false,
            ip_address: ipAddress,
            user_agent: userAgent,
            failure_reason: 'Utilisateur non trouvé'
          });
          
          return new Response(
            JSON.stringify({ error: 'Identifiants incorrects' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if account is locked
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
          const remainingMinutes = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
          return new Response(
            JSON.stringify({ error: `Compte verrouillé. Réessayez dans ${remainingMinutes} minute(s)` }),
            { status: 423, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if account is active
        if (!user.is_active) {
          return new Response(
            JSON.stringify({ error: 'Ce compte est désactivé' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password_hash);
        
        if (!isValid) {
          const newFailedAttempts = (user.failed_attempts || 0) + 1;
          const updates: Record<string, unknown> = { failed_attempts: newFailedAttempts };
          
          // Lock after 5 failed attempts for 15 minutes
          if (newFailedAttempts >= 5) {
            updates.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          }
          
          await supabase
            .from('local_users')
            .update(updates)
            .eq('id', user.id);
          
          await supabase.from('login_attempts').insert({
            username: username.toLowerCase(),
            success: false,
            ip_address: ipAddress,
            user_agent: userAgent,
            failure_reason: 'Mot de passe incorrect'
          });
          
          const attemptsLeft = 5 - newFailedAttempts;
          const message = attemptsLeft > 0 
            ? `Identifiants incorrects. ${attemptsLeft} tentative(s) restante(s)` 
            : 'Compte verrouillé pour 15 minutes';
          
          return new Response(
            JSON.stringify({ error: message }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Reset failed attempts and create session
        const token = generateToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        await supabase
          .from('local_users')
          .update({ 
            failed_attempts: 0, 
            locked_until: null,
            last_login_at: new Date().toISOString()
          })
          .eq('id', user.id);

        // Create session
        await supabase.from('user_sessions').insert({
          user_id: user.id,
          token,
          expires_at: expiresAt.toISOString(),
          ip_address: ipAddress,
          user_agent: userAgent
        });

        // Log successful login
        await supabase.from('login_attempts').insert({
          username: username.toLowerCase(),
          success: true,
          ip_address: ipAddress,
          user_agent: userAgent
        });

        return new Response(
          JSON.stringify({
            token,
            user: {
              id: user.id,
              username: user.username,
              full_name: user.full_name,
              role: user.role,
            },
            expires_at: expiresAt.toISOString()
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'logout': {
        const { token } = params;
        
        if (token) {
          await supabase.from('user_sessions').delete().eq('token', token);
        }
        
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'validate': {
        const { token } = params;
        
        if (!token) {
          return new Response(
            JSON.stringify({ valid: false }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: session } = await supabase
          .from('user_sessions')
          .select('*, local_users(*)')
          .eq('token', token)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (!session || !session.local_users) {
          return new Response(
            JSON.stringify({ valid: false }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const user = session.local_users;
        
        return new Response(
          JSON.stringify({
            valid: true,
            user: {
              id: user.id,
              username: user.username,
              full_name: user.full_name,
              role: user.role,
            }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'change_password': {
        const { token, current_password, new_password } = params;
        
        // Validate session
        const { data: session } = await supabase
          .from('user_sessions')
          .select('*, local_users(*)')
          .eq('token', token)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (!session || !session.local_users) {
          return new Response(
            JSON.stringify({ error: 'Session invalide' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const user = session.local_users;

        // Verify current password
        const isCurrentValid = await verifyPassword(current_password, user.password_hash);
        if (!isCurrentValid) {
          return new Response(
            JSON.stringify({ error: 'Mot de passe actuel incorrect' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Hash new password
        const newHash = await hashPassword(new_password);
        
        await supabase
          .from('local_users')
          .update({ password_hash: newHash })
          .eq('id', user.id);

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create_user': {
        const { username, password, full_name, role } = params;
        
        if (!username || !password) {
          return new Response(
            JSON.stringify({ error: 'Nom d\'utilisateur et mot de passe requis' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if username already exists
        const { data: existing } = await supabase
          .from('local_users')
          .select('id')
          .eq('username', username.toLowerCase())
          .single();

        if (existing) {
          return new Response(
            JSON.stringify({ error: 'Ce nom d\'utilisateur existe déjà' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const passwordHash = await hashPassword(password);
        
        const { data: newUser, error: createError } = await supabase
          .from('local_users')
          .insert({
            username: username.toLowerCase(),
            password_hash: passwordHash,
            full_name: full_name || null,
            role: role || 'observateur',
            is_active: true,
            is_protected: false
          })
          .select()
          .single();

        if (createError) {
          return new Response(
            JSON.stringify({ error: 'Erreur lors de la création: ' + createError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, user: newUser }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_user': {
        const { user_id, username, full_name, role, is_active } = params;
        
        if (!user_id) {
          return new Response(
            JSON.stringify({ error: 'ID utilisateur requis' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // If username is being changed, check it doesn't already exist
        if (username !== undefined) {
          const { data: existing } = await supabase
            .from('local_users')
            .select('id')
            .eq('username', username.toLowerCase())
            .neq('id', user_id)
            .single();

          if (existing) {
            return new Response(
              JSON.stringify({ error: 'Ce nom d\'utilisateur existe déjà' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        const updates: Record<string, unknown> = {};
        if (username !== undefined) updates.username = username.toLowerCase();
        if (full_name !== undefined) updates.full_name = full_name;
        if (role !== undefined) updates.role = role;
        if (is_active !== undefined) updates.is_active = is_active;

        const { error: updateError } = await supabase
          .from('local_users')
          .update(updates)
          .eq('id', user_id);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: 'Erreur lors de la mise à jour: ' + updateError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'admin_reset_password': {
        const { user_id, new_password } = params;
        
        if (!user_id || !new_password) {
          return new Response(
            JSON.stringify({ error: 'ID utilisateur et nouveau mot de passe requis' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const newHash = await hashPassword(new_password);
        
        const { error: updateError } = await supabase
          .from('local_users')
          .update({ password_hash: newHash })
          .eq('id', user_id);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: 'Erreur lors de la réinitialisation: ' + updateError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'unlock_user': {
        const { user_id } = params;
        
        if (!user_id) {
          return new Response(
            JSON.stringify({ error: 'ID utilisateur requis' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: updateError } = await supabase
          .from('local_users')
          .update({ 
            failed_attempts: 0, 
            locked_until: null 
          })
          .eq('id', user_id);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: 'Erreur lors du déverrouillage: ' + updateError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete_user': {
        const { user_id } = params;
        
        if (!user_id) {
          return new Response(
            JSON.stringify({ error: 'ID utilisateur requis' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if user is protected
        const { data: user } = await supabase
          .from('local_users')
          .select('is_protected, username')
          .eq('id', user_id)
          .single();

        if (user?.is_protected) {
          return new Response(
            JSON.stringify({ error: 'Cet utilisateur est protégé et ne peut pas être supprimé' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Delete user sessions first
        await supabase.from('user_sessions').delete().eq('user_id', user_id);
        
        // Delete user
        const { error: deleteError } = await supabase
          .from('local_users')
          .delete()
          .eq('id', user_id);

        if (deleteError) {
          return new Response(
            JSON.stringify({ error: 'Erreur lors de la suppression: ' + deleteError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_login_attempts': {
        const { username, start_date, end_date, success_only } = params;
        
        let query = supabase
          .from('login_attempts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500);

        if (username) {
          query = query.eq('username', username.toLowerCase());
        }

        if (start_date) {
          query = query.gte('created_at', start_date);
        }

        if (end_date) {
          query = query.lte('created_at', end_date);
        }

        if (success_only !== null && success_only !== undefined) {
          query = query.eq('success', success_only);
        }

        const { data: attempts, error: fetchError } = await query;

        if (fetchError) {
          return new Response(
            JSON.stringify({ error: 'Erreur lors de la récupération: ' + fetchError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, attempts }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'init_default_users': {
        // Create default users if they don't exist
        const defaultUsers = [
          { username: 'admin', password: 'admin@123', role: 'admin', full_name: 'Administrateur', is_protected: true },
          { username: 'lumuba', password: 'lumuba@123', role: 'instructeur', full_name: 'LUMUBA', is_protected: true },
          { username: 'eve', password: 'eve@123', role: 'instructeur', full_name: 'EVE', is_protected: true },
          { username: 'guest', password: 'guest@123', role: 'observateur', full_name: 'GUEST', is_protected: true },
        ];

        const results = [];
        
        for (const userData of defaultUsers) {
          const { data: existing } = await supabase
            .from('local_users')
            .select('id')
            .eq('username', userData.username)
            .single();

          if (!existing) {
            const passwordHash = await hashPassword(userData.password);
            const { error } = await supabase.from('local_users').insert({
              username: userData.username,
              password_hash: passwordHash,
              role: userData.role,
              full_name: userData.full_name,
              is_protected: userData.is_protected,
              is_active: true
            });
            
            results.push({ username: userData.username, created: !error, error: error?.message });
          } else {
            results.push({ username: userData.username, created: false, exists: true });
          }
        }

        return new Response(
          JSON.stringify({ success: true, results }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Action non reconnue' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Auth error:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
