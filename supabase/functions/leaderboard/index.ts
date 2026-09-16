import { supabaseAdmin, corsHeaders, jsonResponse } from "./shared.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { profile_id } = await req.json();
    if (!profile_id) throw new Error("ไม่พบผู้ใช้");

    const { data: campaign, error: campErr } = await supabaseAdmin
      .from("campaigns")
      .select("id, name, start_date, end_date, top_n")
      .eq("status", "active")
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (campErr) throw campErr;

    if (!campaign) {
      return jsonResponse({ campaign: null, my_points: 0, top_points: [] });
    }

    const { data: txs, error: txErr } = await supabaseAdmin
      .from("transactions")
      .select("profile_id, total_points, created_at")
      .gte("created_at", `${campaign.start_date}T00:00:00`)
      .lte("created_at", `${campaign.end_date}T23:59:59`);
    if (txErr) throw txErr;

    const totals = new Map<string, number>();
    for (const t of txs ?? []) {
      totals.set(t.profile_id, (totals.get(t.profile_id) ?? 0) + Number(t.total_points));
    }

    const sortedTotals = [...totals.values()].sort((a, b) => b - a);
    const topPoints = sortedTotals.slice(0, campaign.top_n);
    const myPoints = totals.get(profile_id) ?? 0;

    return jsonResponse({
      campaign: {
        name: campaign.name,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
        top_n: campaign.top_n,
      },
      my_points: myPoints,
      top_points: topPoints,
    });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "โหลดกระดานผู้นำไม่สำเร็จ" }, 400);
  }
});
