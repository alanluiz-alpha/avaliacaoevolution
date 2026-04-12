import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Create master user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: "masterav@gmail.com",
        password: "123456",
        email_confirm: true,
        user_metadata: { name: "Master Admin" },
      });

    if (authError && !authError.message.includes("already been registered")) {
      throw authError;
    }

    let userId = authData?.user?.id;

    // If user already exists, find them
    if (!userId) {
      const { data: users } = await supabase.auth.admin.listUsers();
      const existing = users?.users?.find(
        (u) => u.email === "masterav@gmail.com"
      );
      userId = existing?.id;
    }

    if (!userId) {
      throw new Error("Could not find or create master user");
    }

    // Ensure profile exists
    await supabase.from("profiles").upsert(
      {
        user_id: userId,
        name: "Master Admin",
        email: "masterav@gmail.com",
      },
      { onConflict: "user_id" }
    );

    // Assign admin role
    await supabase.from("user_roles").upsert(
      { user_id: userId, role: "admin" },
      { onConflict: "user_id,role" }
    );

    return new Response(
      JSON.stringify({ success: true, userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
