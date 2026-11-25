/** ประวัติคะแนน/คอยน์ และประวัติการแลก */
export type PointTransaction = {
  id: string;
  /** ข้อความที่บันทึกตอนสร้าง (ข้อมูลตัวอย่างเดิม) — รายการใหม่ใช้ key + params แทน เพื่อแปลตามภาษาตอนแสดง */
  title: string;
  amount: number;
  date: string;
  source: string;
  key?: string;
  params?: Record<string, string | number>;
  source_key?: string;
  /** รายการสินค้าย่อย — แสดงเมื่อกด "ดูรายละเอียด" (Figma Point History "Case 7") */
  items?: { name: string; amount: number }[];
};
export type RedeemRecord = {
  id: string;
  name: string;
  points: number;
  date: string;
  status: "pending" | "shipped" | "completed" | "cancelled";
  kind: "reward" | "coupon" | "privilege";
  /** สิทธิพิเศษ: id ที่แลก · วิธีรับ (รับที่หน้าร้าน / จัดส่งถึงบ้าน) · ที่อยู่จัดส่งตอนแลก · รหัสหน้าร้าน */
  privilege_id?: string;
  method?: "pickup" | "delivery";
  address?: { name: string; surname: string; phone: string; text: string; type: "home" | "work" | "other" };
  code?: string;
};

/** ข้อความตาม Figma Point History (583:5440) */
export const pointHistory: PointTransaction[] = [
  { id: "ph-1", title: "คุณได้รับ 50 คะแนน จากการซื้อ Glow Setting Powder Translucent ผ่าน TiktokShop เลขที่คำสั่งซื้อ 123456789", amount: 50, date: "2026-11-16T10:54:00+07:00", source: "TikTok Shop" },
  { id: "ph-2", title: "คุณได้รับ 50 คะแนน จากการซื้อ Glow Setting Powder Translucent ผ่าน Shopee\nเลขที่คำสั่งซื้อ 123456789", amount: 50, date: "2026-11-15T10:54:00+07:00", source: "Shopee" },
  { id: "ph-3", title: "คุณได้รับ 50 คะแนน จากการซื้อ Glow Setting Powder Translucent ผ่าน Lazada\nเลขที่คำสั่งซื้อ 123456789", amount: 50, date: "2026-11-14T10:54:00+07:00", source: "Lazada" },
  {
    id: "ph-4",
    title: "คุณได้รับ 50 คะแนน จากการถ่ายรูปใบเสร็จ 123456789",
    amount: 50,
    date: "2026-11-13T10:54:00+07:00",
    source: "ใบเสร็จ",
    items: [
      { name: "Charmiss Blooming Heart Shining Blush", amount: 20 },
      { name: "Charmiss Blooming Heart Glitter Lip Gloss", amount: 15 },
      { name: "Charmiss Blooming Heart Tinted Lip Serum", amount: 15 },
    ],
  },
  { id: "ph-5", title: "คุณใช้ 200 คะแนน แลก คูปองส่วนลด 15% ทุกรายการ", amount: -200, date: "2026-11-16T14:20:00+07:00", source: "คูปอง" },
];

export const coinHistory: PointTransaction[] = [
  { id: "ch-1", title: "ภารกิจ อัปโหลดใบเสร็จ Longwear Foundation", amount: 100, date: "2026-11-02T18:30:00+07:00", source: "ภารกิจ" },
  { id: "ch-2", title: "เช็คอินรายวัน", amount: 5, date: "2026-11-16T08:10:00+07:00", source: "ภารกิจ" },
  { id: "ch-3", title: "เช็คอินรายวัน", amount: 5, date: "2026-11-15T08:02:00+07:00", source: "ภารกิจ" },
  { id: "ch-4", title: "แลก Crystal Cube", amount: -300, date: "2026-10-20T11:00:00+07:00", source: "แลกรางวัล" },
];

export const redeemHistory: RedeemRecord[] = [
  { id: "rh-1", name: "คูปองส่วนลด 15% ทุกรายการ", points: 200, date: "2026-11-16T14:20:00+07:00", status: "completed", kind: "coupon" },
  { id: "rh-2", name: "Crystal Cube", points: 300, date: "2026-10-20T11:00:00+07:00", status: "shipped", kind: "reward" },
  { id: "rh-3", name: "Brookie Brow Slim Pencil", points: 250, date: "2026-09-02T15:30:00+07:00", status: "cancelled", kind: "reward" },
];

/** คะแนนที่หมดอายุ (แท็บ "คะแนนที่หมดอายุ" ในหน้า /history — ต้นฉบับ: fetch expire transactions) */
export const expiredPoints: PointTransaction[] = [
  { id: "ex-1", title: "คุณมี 50 คะแนน ที่จะหมดอายุภายในวันที่ 31 ธ.ค. 2569", amount: 50, date: "2026-11-01T10:54:00+07:00", source: "ระบบ" },
];

/** ภาพปกจำลองตามประเภทการแลก (ไม่มีรูปจริง) */
export const redeemCover: Record<RedeemRecord["kind"], [string, string]> = {
  reward: ["#FFF1F5", "#F1336E"],
  coupon: ["#FFE9CC", "#FF9300"],
  privilege: ["#E4DCFF", "#7650FF"],
};
