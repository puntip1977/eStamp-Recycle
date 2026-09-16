import { supabaseAdmin, corsHeaders, jsonResponse } from "./shared.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { data, error } = await supabaseAdmin.from("branches").select("id, name").order("name");
    if (error) throw error;
    return jsonResponse({ branches: data });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "โหลดสาขาไม่สำเร็จ" }, 400);
  }
});
