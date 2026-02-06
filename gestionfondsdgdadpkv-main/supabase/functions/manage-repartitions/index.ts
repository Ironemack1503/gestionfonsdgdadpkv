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

function canEdit(role: string): boolean {
  return role === 'admin' || role === 'instructeur';
}

// Convertir un montant en lettres (version simplifiée)
function montantEnLettre(montant: number): string {
  const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const dizaines = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
  const exceptions = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize'];
  
  if (montant === 0) return 'zéro franc';
  
  const convertirCentaine = (n: number): string => {
    if (n === 0) return '';
    if (n < 10) return unites[n];
    if (n < 17) return exceptions[n - 10];
    if (n < 20) return 'dix-' + unites[n - 10];
    if (n < 70) {
      const d = Math.floor(n / 10);
      const u = n % 10;
      if (u === 0) return dizaines[d];
      if (u === 1 && d !== 8) return dizaines[d] + ' et un';
      return dizaines[d] + '-' + unites[u];
    }
    if (n < 80) {
      const u = n - 70;
      if (u === 0) return 'soixante-dix';
      if (u === 1) return 'soixante et onze';
      return 'soixante-' + (u < 7 ? exceptions[u] : 'dix-' + unites[u]);
    }
    if (n < 100) {
      const u = n - 80;
      if (u === 0) return 'quatre-vingt';
      return 'quatre-vingt-' + (u < 7 ? (u < 10 ? unites[u] : exceptions[u - 10]) : 'dix-' + unites[u - 10]);
    }
    const c = Math.floor(n / 100);
    const r = n % 100;
    const prefix = c === 1 ? 'cent' : unites[c] + ' cent';
    if (r === 0) return c > 1 ? prefix + 's' : prefix;
    return prefix + ' ' + convertirCentaine(r);
  };

  let result = '';
  const millions = Math.floor(montant / 1000000);
  const milliers = Math.floor((montant % 1000000) / 1000);
  const reste = Math.floor(montant % 1000);

  if (millions > 0) {
    result += (millions === 1 ? 'un million' : convertirCentaine(millions) + ' millions') + ' ';
  }
  if (milliers > 0) {
    result += (milliers === 1 ? 'mille' : convertirCentaine(milliers) + ' mille') + ' ';
  }
  if (reste > 0) {
    result += convertirCentaine(reste);
  }

  return result.trim() + ' francs';
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
        const { data, error } = await supabase
          .from('repartitions')
          .select(`
            *,
            service:services(id, code, libelle)
          `)
          .order('date_repartition', { ascending: false })
          .order('numero_ordre', { ascending: false });

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
        if (!canEdit(user.role)) {
          return new Response(
            JSON.stringify({ error: 'Permission refusée. Rôle admin ou instructeur requis.' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { numero_repartition, montant, service_id, observation } = params;

        if (!numero_repartition || montant === undefined) {
          return new Response(
            JSON.stringify({ error: 'Numéro de répartition et montant requis' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const montant_lettre = montantEnLettre(montant);

        const { data, error } = await supabase
          .from('repartitions')
          .insert({
            numero_repartition,
            montant,
            montant_lettre,
            service_id: service_id || null,
            observation: observation || null,
            user_id: user.id,
            date_repartition: new Date().toISOString().split('T')[0],
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
          table_name: 'repartitions',
          record_id: data.id,
          action: 'INSERT',
          new_data: data,
          user_id: user.id,
          user_email: user.username,
        });

        return new Response(
          JSON.stringify({ data }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update': {
        if (!canEdit(user.role)) {
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

        // Recalculer montant en lettres si montant modifié
        if (updates.montant !== undefined) {
          updates.montant_lettre = montantEnLettre(updates.montant);
        }

        // Get old data for audit
        const { data: oldData } = await supabase
          .from('repartitions')
          .select('*')
          .eq('id', id)
          .single();

        const { data, error } = await supabase
          .from('repartitions')
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
            table_name: 'repartitions',
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
        if (!canEdit(user.role)) {
          return new Response(
            JSON.stringify({ error: 'Permission refusée. Rôle admin ou instructeur requis.' }),
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
          .from('repartitions')
          .select('*')
          .eq('id', id)
          .single();

        const { error } = await supabase
          .from('repartitions')
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
            table_name: 'repartitions',
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
