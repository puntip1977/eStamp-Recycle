import { supabaseAdmin, corsHeaders, jsonResponse } from "./shared.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { profile_id } = await req.json();
    if (!profile_id) throw new Error("ไม่พบผู้ใช้");

    const { data: transactions, error } = await supabaseAdmin
      .from("transactions")
      .select("id, created_at, total_points, photo_path, transaction_items(count, item_types(name))")
      .eq("profile_id", profile_id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;

    const result = await Promise.all(
      (transactions ?? []).map(async (t: any) => {
        let photo_url: string | null = null;
        if (t.photo_path) {
          const { data: signed } = await supabaseAdmin.storage
            .from("photos")
            .createSignedUrl(t.photo_path, 3600);
          photo_url = signed?.signedUrl ?? null;
        }
        return {
          id: t.id,
          created_at: t.created_at,
          total_points: t.total_points,
          photo_url,
          items: (t.transaction_items ?? []).map((ti: any) => ({
            name: ti.item_types?.name ?? "ไม่ทราบ",
            count: ti.count,
          })),
        };
      })
    );

    return jsonResponse({ transactions: result });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "โหลดประวัติไม่สำเร็จ" }, 400);
  }
});
