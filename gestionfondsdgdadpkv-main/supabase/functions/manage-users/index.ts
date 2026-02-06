import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { action, token, ...params } = await req.json();

    // Validate session token
    if (!token) {
      return new Response(JSON.stringify({ error: "Token requis" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if token is valid and not expired
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select('user_id, expires_at')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: "Session invalide ou expirée" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the user and check if they are admin
    const { data: currentUser, error: userError } = await supabase
      .from('local_users')
      .select('id, username, role, is_active')
      .eq('id', session.user_id)
      .single();

    if (userError || !currentUser) {
      return new Response(JSON.stringify({ error: "Utilisateur non trouvé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!currentUser.is_active) {
      return new Response(JSON.stringify({ error: "Compte désactivé" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (currentUser.role !== 'admin') {
      return new Response(JSON.stringify({ error: "Accès administrateur requis" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    switch (action) {
      case "list": {
        const { data: users, error: listError } = await supabase
          .from('local_users')
          .select('id, username, full_name, role, is_active, is_protected, failed_attempts, locked_until, last_login_at, created_at, updated_at')
          .order('created_at', { ascending: true });

        if (listError) {
          console.error("Error listing users:", listError);
          return new Response(JSON.stringify({ error: listError.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, users }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "create": {
        const { username, password, full_name, role } = params;
        
        if (!username || !password) {
          return new Response(JSON.stringify({ error: "Nom d'utilisateur et mot de passe requis" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Check if username already exists
        const { data: existing } = await supabase
          .from('local_users')
          .select('id')
          .eq('username', username.toLowerCase().trim())
          .single();

        if (existing) {
          return new Response(JSON.stringify({ error: "Ce nom d'utilisateur existe déjà" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Hash password using Web Crypto API
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const { data: newUser, error: createError } = await supabase
          .from('local_users')
          .insert({
            username: username.toLowerCase().trim(),
            password_hash: passwordHash,
            full_name: full_name || null,
            role: role || 'observateur',
          })
          .select('id, username, full_name, role, is_active, created_at')
          .single();

        if (createError) {
          console.error("Error creating user:", createError);
          return new Response(JSON.stringify({ error: createError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, user: newUser }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update": {
        const { user_id, username, full_name, role, is_active } = params;
        
        if (!user_id) {
          return new Response(JSON.stringify({ error: "ID utilisateur requis" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Check if user is protected
        const { data: targetUser } = await supabase
          .from('local_users')
          .select('is_protected')
          .eq('id', user_id)
          .single();

        if (targetUser?.is_protected && (role !== undefined || is_active === false)) {
          return new Response(JSON.stringify({ error: "Cet utilisateur est protégé" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const updateData: Record<string, unknown> = {};
        if (username !== undefined) updateData.username = username.toLowerCase().trim();
        if (full_name !== undefined) updateData.full_name = full_name;
        if (role !== undefined) updateData.role = role;
        if (is_active !== undefined) updateData.is_active = is_active;

        const { data: updatedUser, error: updateError } = await supabase
          .from('local_users')
          .update(updateData)
          .eq('id', user_id)
          .select('id, username, full_name, role, is_active, updated_at')
          .single();

        if (updateError) {
          console.error("Error updating user:", updateError);
          return new Response(JSON.stringify({ error: updateError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, user: updatedUser }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "reset_password": {
        const { user_id, new_password } = params;
        
        if (!user_id || !new_password) {
          return new Response(JSON.stringify({ error: "ID utilisateur et nouveau mot de passe requis" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (new_password.length < 6) {
          return new Response(JSON.stringify({ error: "Le mot de passe doit contenir au moins 6 caractères" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Hash new password
        const encoder = new TextEncoder();
        const data = encoder.encode(new_password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const { error: resetError } = await supabase
          .from('local_users')
          .update({ password_hash: passwordHash })
          .eq('id', user_id);

        if (resetError) {
          console.error("Error resetting password:", resetError);
          return new Response(JSON.stringify({ error: resetError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "unlock": {
        const { user_id } = params;
        
        if (!user_id) {
          return new Response(JSON.stringify({ error: "ID utilisateur requis" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error: unlockError } = await supabase
          .from('local_users')
          .update({ 
            failed_attempts: 0, 
            locked_until: null 
          })
          .eq('id', user_id);

        if (unlockError) {
          console.error("Error unlocking user:", unlockError);
          return new Response(JSON.stringify({ error: unlockError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        const { user_id } = params;
        
        if (!user_id) {
          return new Response(JSON.stringify({ error: "ID utilisateur requis" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Prevent self-deletion
        if (user_id === currentUser.id) {
          return new Response(JSON.stringify({ error: "Impossible de supprimer votre propre compte" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Check if user is protected
        const { data: targetUser } = await supabase
          .from('local_users')
          .select('is_protected')
          .eq('id', user_id)
          .single();

        if (targetUser?.is_protected) {
          return new Response(JSON.stringify({ error: "Cet utilisateur est protégé et ne peut pas être supprimé" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error: deleteError } = await supabase
          .from('local_users')
          .delete()
          .eq('id', user_id);

        if (deleteError) {
          console.error("Error deleting user:", deleteError);
          return new Response(JSON.stringify({ error: deleteError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Action invalide" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
