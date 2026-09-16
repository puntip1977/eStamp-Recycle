import { supabaseAdmin, corsHeaders, jsonResponse, requireAdmin } from "./shared.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const { profile_id, action } = body;
    await requireAdmin(profile_id);

    if (action === "list") {
      const { data, error } = await supabaseAdmin
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return jsonResponse({ campaigns: data });
    }

    if (action === "create") {
      const { name, start_date, end_date, top_n } = body;
      if (!name || !start_date || !end_date || !top_n) throw new Error("กรุณากรอกข้อมูลให้ครบถ้วน");
      const { error } = await supabaseAdmin
        .from("campaigns")
        .insert({ name, start_date, end_date, top_n });
      if (error) throw error;
      return jsonResponse({ ok: true });
    }

    if (action === "finalize") {
      const { id } = body;
      if (!id) throw new Error("ไม่พบรอบแข่ง");

      const { data: campaign, error: campErr } = await supabaseAdmin
        .from("campaigns")
        .select("*")
        .eq("id", id)
        .single();
      if (campErr) throw campErr;
      if (campaign.status !== "active") throw new Error("รอบแข่งนี้ปิดไปแล้ว");

      const { data: txs, error: txErr } = await supabaseAdmin
        .from("transactions")
        .select("profile_id, total_points")
        .gte("created_at", `${campaign.start_date}T00:00:00`)
        .lte("created_at", `${campaign.end_date}T23:59:59`);
      if (txErr) throw txErr;

      const totals = new Map<string, number>();
      for (const t of txs ?? []) {
        totals.set(t.profile_id, (totals.get(t.profile_id) ?? 0) + Number(t.total_points));
      }

      const ranked = [...totals.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, campaign.top_n);

      if (ranked.length > 0) {
        const { error: insertErr } = await supabaseAdmin.from("campaign_winners").insert(
          ranked.map(([winnerProfileId], idx) => ({
            campaign_id: id,
            profile_id: winnerProfileId,
            rank: idx + 1,
          }))
        );
        if (insertErr) throw insertErr;
      }

      const { error: closeErr } = await supabaseAdmin
        .from("campaigns")
        .update({ status: "closed" })
        .eq("id", id);
      if (closeErr) throw closeErr;

      return jsonResponse({ winners: await getWinners(id, campaign.start_date, campaign.end_date) });
    }

    if (action === "get-winners") {
      const { id } = body;
      if (!id) throw new Error("ไม่พบรอบแข่ง");
      const { data: campaign, error: campErr } = await supabaseAdmin
        .from("campaigns")
        .select("start_date, end_date")
        .eq("id", id)
        .single();
      if (campErr) throw campErr;
      return jsonResponse({ winners: await getWinners(id, campaign.start_date, campaign.end_date) });
    }

    if (action === "assign-reward") {
      const { campaign_id, winner_profile_id, reward_id } = body;
      if (!campaign_id || !winner_profile_id || !reward_id) throw new Error("ข้อมูลไม่ครบถ้วน");
      const { error } = await supabaseAdmin
        .from("campaign_winners")
        .update({ reward_id })
        .eq("campaign_id", campaign_id)
        .eq("profile_id", winner_profile_id);
      if (error) throw error;
      return jsonResponse({ ok: true });
    }

    throw new Error("ไม่รู้จักคำสั่งนี้");
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "ดำเนินการไม่สำเร็จ" }, 400);
  }
});

async function getWinners(campaignId: string, startDate: string, endDate: string) {
  const { data, error } = await supabaseAdmin
    .from("campaign_winners")
    .select("rank, profile_id, reward_id, profiles(nickname), rewards(name)")
    .eq("campaign_id", campaignId)
    .order("rank", { ascending: true });
  if (error) throw error;

  const { data: totals, error: totalsErr } = await supabaseAdmin
    .from("transactions")
    .select("profile_id, total_points")
    .gte("created_at", `${startDate}T00:00:00`)
    .lte("created_at", `${endDate}T23:59:59`);
  if (totalsErr) throw totalsErr;
  const pointsByProfile = new Map<string, number>();
  for (const t of totals ?? []) {
    pointsByProfile.set(t.profile_id, (pointsByProfile.get(t.profile_id) ?? 0) + Number(t.total_points));
  }

  return (data ?? []).map((w: any) => ({
    profile_id: w.profile_id,
    nickname: w.profiles?.nickname ?? "ไม่ทราบชื่อ",
    rank: w.rank,
    points: pointsByProfile.get(w.profile_id) ?? 0,
    reward_id: w.reward_id,
    reward_name: w.rewards?.name ?? null,
  }));
}
