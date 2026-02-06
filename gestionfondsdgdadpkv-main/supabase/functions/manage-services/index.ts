import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ServiceData {
  code?: string;
  libelle?: string;
  is_active?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, token, ...params } = await req.json();

    // Validate session token
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token de session requis" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify session
    const { data: session, error: sessionError } = await supabase
      .from("user_sessions")
      .select("*, local_users(*)")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: "Session invalide ou expirée" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = session.local_users;

    // Handle different actions
    switch (action) {
      case "list": {
        const { data, error } = await supabase
          .from("services")
          .select("*")
          .order("code", { ascending: true });

        if (error) throw error;
        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "create": {
        // Only admin can create
        if (user.role !== "admin") {
          return new Response(
            JSON.stringify({ error: "Accès non autorisé" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { code, libelle } = params as ServiceData;

        if (!code || !libelle) {
          return new Response(
            JSON.stringify({ error: "Code et libellé requis" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check for duplicate code
        const { data: existing } = await supabase
          .from("services")
          .select("id")
          .eq("code", code)
          .single();

        if (existing) {
          return new Response(
            JSON.stringify({ error: "Un service avec ce code existe déjà" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("services")
          .insert({ code, libelle, is_active: true })
          .select()
          .single();

        if (error) throw error;
        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update": {
        // Only admin can update
        if (user.role !== "admin") {
          return new Response(
            JSON.stringify({ error: "Accès non autorisé" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { id, ...updates } = params;

        if (!id) {
          return new Response(
            JSON.stringify({ error: "ID du service requis" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("services")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        // Only admin can delete
        if (user.role !== "admin") {
          return new Response(
            JSON.stringify({ error: "Accès non autorisé" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { id } = params;

        if (!id) {
          return new Response(
            JSON.stringify({ error: "ID du service requis" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if service is used in any transactions
        const { data: recettes } = await supabase
          .from("recettes")
          .select("id")
          .eq("service_id", id)
          .limit(1);

        const { data: depenses } = await supabase
          .from("depenses")
          .select("id")
          .eq("service_id", id)
          .limit(1);

        if ((recettes && recettes.length > 0) || (depenses && depenses.length > 0)) {
          return new Response(
            JSON.stringify({ error: "Ce service est utilisé dans des transactions et ne peut pas être supprimé" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("services")
          .delete()
          .eq("id", id);

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Action non reconnue" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error in manage-services:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur serveur";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
