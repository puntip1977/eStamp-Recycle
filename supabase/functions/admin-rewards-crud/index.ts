import { supabaseAdmin, corsHeaders, jsonResponse, requireAdmin } from "./shared.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const { profile_id, action } = body;
    await requireAdmin(profile_id);

    if (action === "list") {
      const { data, error } = await supabaseAdmin
        .from("rewards")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return jsonResponse({ rewards: data });
    }

    if (action === "create") {
      const { name, description, image_url } = body;
      if (!name) throw new Error("กรุณาระบุชื่อของรางวัล");
      const { error } = await supabaseAdmin
        .from("rewards")
        .insert({ name, description: description ?? null, image_url: image_url ?? null });
      if (error) throw error;
      return jsonResponse({ ok: true });
    }

    if (action === "update") {
      const { id, name, description, image_url, active } = body;
      if (!id) throw new Error("ไม่พบของรางวัล");
      const patch: Record<string, unknown> = {};
      if (name !== undefined) patch.name = name;
      if (description !== undefined) patch.description = description;
      if (image_url !== undefined) patch.image_url = image_url;
      if (active !== undefined) patch.active = active;
      const { error } = await supabaseAdmin.from("rewards").update(patch).eq("id", id);
      if (error) throw error;
      return jsonResponse({ ok: true });
    }

    throw new Error("ไม่รู้จักคำสั่งนี้");
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "ดำเนินการไม่สำเร็จ" }, 400);
  }
});
