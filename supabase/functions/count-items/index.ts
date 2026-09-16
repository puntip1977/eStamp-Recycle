import { supabaseAdmin, corsHeaders, jsonResponse } from "./shared.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

interface DetectedItem {
  type: string;
  count: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!OPENAI_API_KEY) throw new Error("ระบบยังไม่ได้ตั้งค่า OPENAI_API_KEY กรุณาติดต่อแอดมิน");

    const { profile_id, branch_id, path } = await req.json();
    if (!profile_id || !path) throw new Error("ข้อมูลไม่ครบถ้วน");

    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("photos")
      .createSignedUrl(path, 300);
    if (signErr) throw signErr;

    const { data: itemTypes, error: itemErr } = await supabaseAdmin
      .from("item_types")
      .select("id, name, points_per_unit")
      .eq("active", true);
    if (itemErr) throw itemErr;
    if (!itemTypes || itemTypes.length === 0) throw new Error("ยังไม่มีประเภทขยะให้นับ");

    const typeNames = itemTypes.map((t) => t.name).join(", ");

    const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              `คุณคือระบบนับจำนวนขยะรีไซเคิลในรูปภาพ ให้นับจำนวนเฉพาะประเภทต่อไปนี้เท่านั้น: ${typeNames}. ` +
              `ตอบเป็น JSON เท่านั้นในรูปแบบ {"items": [{"type": "ชื่อประเภท", "count": จำนวนที่เป็นตัวเลข}]} ` +
              `ถ้าไม่พบสิ่งของที่ต้องนับในรูป ให้ตอบ {"items": []}`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "นับจำนวนขวดพลาสติก/กระป๋องในรูปนี้" },
              { type: "image_url", image_url: { url: signed.signedUrl } },
            ],
          },
        ],
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      throw new Error(`เรียก AI นับจำนวนไม่สำเร็จ: ${errText}`);
    }

    const aiJson = await aiResp.json();
    const content = aiJson.choices?.[0]?.message?.content ?? '{"items":[]}';
    const parsed = JSON.parse(content) as { items: DetectedItem[] };

    const matched = (parsed.items ?? [])
      .map((detected) => {
        const itemType = itemTypes.find(
          (t) =>
            t.name === detected.type ||
            t.name.includes(detected.type) ||
            detected.type.includes(t.name)
        );
        if (!itemType || !detected.count || detected.count <= 0) return null;
        const count = Math.round(detected.count);
        return {
          item_type_id: itemType.id,
          name: itemType.name,
          count,
          points: count * Number(itemType.points_per_unit),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const totalPoints = matched.reduce((sum, m) => sum + m.points, 0);

    const { data: transaction, error: txErr } = await supabaseAdmin
      .from("transactions")
      .insert({
        profile_id,
        branch_id: branch_id ?? null,
        photo_path: path,
        ai_raw_result: parsed,
        total_points: totalPoints,
      })
      .select("id, created_at, total_points, photo_path")
      .single();
    if (txErr) throw txErr;

    if (matched.length > 0) {
      const { error: itemsErr } = await supabaseAdmin.from("transaction_items").insert(
        matched.map((m) => ({
          transaction_id: transaction.id,
          item_type_id: m.item_type_id,
          count: m.count,
          points: m.points,
        }))
      );
      if (itemsErr) throw itemsErr;
    }

    return jsonResponse({
      id: transaction.id,
      total_points: transaction.total_points,
      created_at: transaction.created_at,
      photo_path: transaction.photo_path,
      items: matched.map((m) => ({
        item_type_id: m.item_type_id,
        name: m.name,
        count: m.count,
        points: m.points,
      })),
    });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "นับจำนวนไม่สำเร็จ" }, 400);
  }
});
