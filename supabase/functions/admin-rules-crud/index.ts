import { supabaseAdmin, corsHeaders, jsonResponse, requireAdmin } from "./shared.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const { profile_id, action } = body;
    await requireAdmin(profile_id);

    if (action === "list") {
      const { data, error } = await supabaseAdmin
        .from("item_types")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return jsonResponse({ item_types: data });
    }

    if (action === "create") {
      const { name, points_per_unit, icon } = body;
      if (!name || points_per_unit === undefined) throw new Error("กรุณาระบุชื่อและแต้มต่อหน่วย");
      const { error } = await supabaseAdmin
        .from("item_types")
        .insert({ name, points_per_unit, icon: icon ?? null });
      if (error) throw error;
      return jsonResponse({ ok: true });
    }

    if (action === "update") {
      const { id, name, points_per_unit, icon, active } = body;
      if (!id) throw new Error("ไม่พบประเภทขยะ");
      const patch: Record<string, unknown> = {};
      if (name !== undefined) patch.name = name;
      if (points_per_unit !== undefined) patch.points_per_unit = points_per_unit;
      if (icon !== undefined) patch.icon = icon;
      if (active !== undefined) patch.active = active;
      const { error } = await supabaseAdmin.from("item_types").update(patch).eq("id", id);
      if (error) throw error;
      return jsonResponse({ ok: true });
    }

    throw new Error("ไม่รู้จักคำสั่งนี้");
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "ดำเนินการไม่สำเร็จ" }, 400);
  }
});
