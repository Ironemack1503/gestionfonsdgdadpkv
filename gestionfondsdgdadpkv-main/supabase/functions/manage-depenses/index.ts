import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SessionUser {
  id: string;
  username: string;
  full_name: string | null;
  role: 'admin' | 'instructeur' | 'observateur';
}

interface LocalUser {
  id: string;
  username: string;
  full_name: string | null;
  role: 'admin' | 'instructeur' | 'observateur';
  is_active: boolean;
}

interface SessionWithUser {
  local_users: LocalUser;
}

// deno-lint-ignore no-explicit-any
async function validateSession(supabase: any, token: string): Promise<SessionUser | null> {
  if (!token) return null;

  const { data: session } = await supabase
    .from('user_sessions')
    .select('*, local_users(*)')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single();

  const typedSession = session as SessionWithUser | null;
  
  if (!typedSession || !typedSession.local_users || !typedSession.local_users.is_active) {
    return null;
  }

  const user = typedSession.local_users;
  return {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
  };
}

function canWrite(role: string): boolean {
  return role === 'admin' || role === 'instructeur';
}

function canDelete(role: string): boolean {
  return role === 'admin';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { action, token, ...params } = await req.json();

    // Validate session for all actions
    const user = await validateSession(supabase, token);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Session invalide ou expirée' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'list': {
        const { page = 1, pageSize = 50 } = params;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error } = await supabase
          .from('depenses')
          .select(`
            *,
            rubrique:rubriques(id, code, libelle)
          `)
          .order('date_transaction', { ascending: false })
          .order('heure', { ascending: false })
          .range(from, to);

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ data }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'count': {
        const { count, error } = await supabase
          .from('depenses')
          .select('*', { count: 'exact', head: true });

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ count: count || 0 }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'listAll': {
        const { data, error } = await supabase
          .from('depenses')
          .select(`
            *,
            rubrique:rubriques(id, code, libelle)
          `)
          .order('date_transaction', { ascending: false })
          .order('heure', { ascending: false });

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ data }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create': {
        if (!canWrite(user.role)) {
          return new Response(
            JSON.stringify({ error: 'Permission refusée. Rôle admin ou instructeur requis.' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { rubrique_id, beneficiaire, motif, montant, montant_lettre, observation } = params;

        if (!rubrique_id || !beneficiaire || !motif || montant === undefined) {
          return new Response(
            JSON.stringify({ error: 'Données manquantes' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await supabase
          .from('depenses')
          .insert({
            rubrique_id,
            beneficiaire,
            motif,
            montant,
            montant_lettre: montant_lettre || null,
            observation: observation || null,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Log audit
        await supabase.from('audit_logs').insert({
          table_name: 'depenses',
          record_id: data.id,
          action: 'INSERT',
          new_data: data,
          user_id: user.id,
          user_email: user.username,
        });

        // Check for important expense alert
        const { data: alertSetting } = await supabase
          .from('alert_settings')
          .select('setting_value')
          .eq('setting_key', 'seuil_depense_importante')
          .eq('is_active', true)
          .single();

        if (alertSetting && montant >= alertSetting.setting_value) {
          await supabase.from('alerts').insert({
            alert_type: 'depense_importante',
            title: 'Dépense importante enregistrée',
            message: `Une dépense de ${montant.toLocaleString('fr-FR')} FC a été enregistrée: ${motif}`,
            severity: montant >= alertSetting.setting_value * 2 ? 'critical' : 'warning',
            related_record_id: data.id,
            related_table: 'depenses',
            metadata: { montant, seuil: alertSetting.setting_value, motif },
          });
        }

        return new Response(
          JSON.stringify({ data }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update': {
        if (!canWrite(user.role)) {
          return new Response(
            JSON.stringify({ error: 'Permission refusée. Rôle admin ou instructeur requis.' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { id, ...updates } = params;

        if (!id) {
          return new Response(
            JSON.stringify({ error: 'ID requis' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get old data for audit
        const { data: oldData } = await supabase
          .from('depenses')
          .select('*')
          .eq('id', id)
          .single();

        const { data, error } = await supabase
          .from('depenses')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Log audit
        if (oldData) {
          const changedFields = Object.keys(updates).filter(
            key => JSON.stringify(oldData[key]) !== JSON.stringify(data[key])
          );
          
          await supabase.from('audit_logs').insert({
            table_name: 'depenses',
            record_id: id,
            action: 'UPDATE',
            old_data: oldData,
            new_data: data,
            changed_fields: changedFields,
            user_id: user.id,
            user_email: user.username,
          });
        }

        return new Response(
          JSON.stringify({ data }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        if (!canDelete(user.role)) {
          return new Response(
            JSON.stringify({ error: 'Permission refusée. Rôle admin requis.' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { id } = params;

        if (!id) {
          return new Response(
            JSON.stringify({ error: 'ID requis' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get old data for audit
        const { data: oldData } = await supabase
          .from('depenses')
          .select('*')
          .eq('id', id)
          .single();

        const { error } = await supabase
          .from('depenses')
          .delete()
          .eq('id', id);

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Log audit
        if (oldData) {
          await supabase.from('audit_logs').insert({
            table_name: 'depenses',
            record_id: id,
            action: 'DELETE',
            old_data: oldData,
            user_id: user.id,
            user_email: user.username,
          });
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Action non reconnue' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (err) {
    console.error('Error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Erreur interne du serveur';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
