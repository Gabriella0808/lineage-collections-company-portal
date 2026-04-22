import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data, error } = await admin.auth.admin.updateUserById(
    "664c4627-764e-44ff-94ed-d887e3097265",
    { email: "bhholbrook@gmail.com", email_confirm: true },
  );
  return new Response(JSON.stringify({ data, error }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
