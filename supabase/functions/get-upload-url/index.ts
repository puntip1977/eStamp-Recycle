import { supabaseAdmin, corsHeaders, jsonResponse } from "./shared.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { profile_id } = await req.json();
    if (!profile_id) throw new Error("ไม่พบผู้ใช้");

    const path = `${profile_id}/${Date.now()}.jpg`;
    const { data, error } = await supabaseAdmin.storage.from("photos").createSignedUploadUrl(path);
    if (error) throw error;

    return jsonResponse({ path: data.path, token: data.token });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "สร้างลิงก์อัปโหลดไม่สำเร็จ" }, 400);
  }
});
