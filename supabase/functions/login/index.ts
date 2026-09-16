import { supabaseAdmin, corsHeaders, jsonResponse } from "./shared.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { nickname, phone, branch_id } = await req.json();
    if (!nickname || !phone) throw new Error("กรุณากรอกชื่อเล่นและเบอร์โทร");

    const { data: existing, error: findErr } = await supabaseAdmin
      .from("profiles")
      .select("id, nickname, phone, branch_id, role")
      .eq("phone", phone)
      .maybeSingle();
    if (findErr) throw findErr;

    if (existing) {
      return jsonResponse({ profile: existing });
    }

    const { data: created, error: createErr } = await supabaseAdmin
      .from("profiles")
      .insert({ nickname, phone, branch_id: branch_id ?? null })
      .select("id, nickname, phone, branch_id, role")
      .single();
    if (createErr) throw createErr;

    return jsonResponse({ profile: created });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "เข้าสู่ระบบไม่สำเร็จ" }, 400);
  }
});
