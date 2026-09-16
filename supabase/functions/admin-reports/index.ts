import { supabaseAdmin, corsHeaders, jsonResponse, requireAdmin } from "./shared.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { profile_id } = await req.json();
    await requireAdmin(profile_id);

    const { data: txs, error: txErr } = await supabaseAdmin
      .from("transactions")
      .select("id, total_points, branch_id, branches(name)");
    if (txErr) throw txErr;

    const { data: items, error: itemErr } = await supabaseAdmin
      .from("transaction_items")
      .select("count, points, item_types(name)");
    if (itemErr) throw itemErr;

    const totalPoints = (txs ?? []).reduce((s: number, t: any) => s + Number(t.total_points), 0);
    const totalTransactions = (txs ?? []).length;

    const byBranchMap = new Map<string, number>();
    for (const t of txs ?? []) {
      const name = (t as any).branches?.name ?? "ไม่ระบุสาขา";
      byBranchMap.set(name, (byBranchMap.get(name) ?? 0) + Number(t.total_points));
    }

    const byItemMap = new Map<string, { count: number; points: number }>();
    for (const i of items ?? []) {
      const name = (i as any).item_types?.name ?? "ไม่ทราบ";
      const curr = byItemMap.get(name) ?? { count: 0, points: 0 };
      curr.count += Number(i.count);
      curr.points += Number(i.points);
      byItemMap.set(name, curr);
    }

    return jsonResponse({
      total_points: totalPoints,
      total_transactions: totalTransactions,
      by_branch: [...byBranchMap.entries()].map(([branch_name, points]) => ({ branch_name, points })),
      by_item_type: [...byItemMap.entries()].map(([item_type_name, v]) => ({
        item_type_name,
        count: v.count,
        points: v.points,
      })),
    });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "โหลดรายงานไม่สำเร็จ" }, 400);
  }
});
