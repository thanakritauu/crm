/** ของรางวัล (ต้นฉบับ: /reward, /retail — ชื่อสินค้าจากหน้า reward ที่เปิดได้จริง) */
export type Reward = {
  id: string;
  name: string;
  category: string;
  points: number;
  stock: number;
  cover: [string, string];
  /** รูปตัวอย่าง (จากภารกิจจริงของ Charmiss Club ใน public/images/missions) — ไม่มี = ภาพไล่สี */
  image?: string;
  description: string;
  conditions: string[];
  redeem_start: string;
  redeem_end: string;
};

/**
 * หมวดหมู่ (ต้นฉบับ: tag-selection — ไอคอนกลม 32px + ป้ายชื่อ; ข้อมูลจริงยังเป็น placeholder "Item 1..")
 * `cover` ใช้วาดไอคอนกลมแทนรูป
 */
export type RewardCategory = { value: string; label: string; cover: [string, string] };

export const rewardCategories: RewardCategory[] = [
  { value: "all", label: "ทั้งหมด", cover: ["#FCD6E2", "#F1336E"] },
  { value: "face", label: "ผิวหน้า", cover: ["#FFF7ED", "#FF9300"] },
  { value: "eyes", label: "ดวงตา", cover: ["#EEF2FF", "#7650FF"] },
  { value: "lips", label: "ริมฝีปาก", cover: ["#FFE4E6", "#E11D48"] },
];

export const rewards: Reward[] = [
  { id: "r-001", name: "Charmiss Blooming Heart Shining Blush", category: "face", points: 450, stock: 24, cover: ["#FFF1F5", "#FCD6E2"], description: "บลัชออนเนื้อชิมเมอร์ ประกายฉ่ำวาว ลายหัวใจ Blooming Heart", conditions: ["แลกได้ 1 ชิ้นต่อสมาชิก", "จัดส่งภายใน 7 วันทำการ"], redeem_start: "2026-11-01", redeem_end: "2026-12-31", image: "/images/missions/m01.jpg" },
  { id: "r-002", name: "Charmiss Blooming Heart Glitter Lip Gloss", category: "lips", points: 890, stock: 12, cover: ["#FFF7ED", "#FFE9CC"], description: "ลิปกลอสกลิตเตอร์ ปากฉ่ำวาว ไม่เหนียวเหนอะหนะ", conditions: ["แลกได้ 1 ชิ้นต่อสมาชิก"], redeem_start: "2026-11-01", redeem_end: "2026-12-31", image: "/images/missions/m02.jpg" },
  { id: "r-003", name: "Charmiss Blooming Heart Tinted Lip Serum", category: "lips", points: 300, stock: 40, cover: ["#F5F3FF", "#E4DCFF"], description: "ลิปเซรั่มสีระเรื่อ บำรุงริมฝีปากให้ชุ่มชื้น", conditions: ["แลกได้ไม่จำกัด"], redeem_start: "2026-11-01", redeem_end: "2026-12-31", image: "/images/missions/m11.jpg" },
  { id: "r-004", name: "Charmiss Glow Airy Cushion SPF50+ PA++++", category: "face", points: 520, stock: 8, cover: ["#EEF2FF", "#C7D2FE"], description: "คุชชั่นเนื้อบางเบา ผิวโกลว์ กันแดด SPF50+ PA++++", conditions: ["แลกได้ 1 ชิ้นต่อสมาชิก"], redeem_start: "2026-11-01", redeem_end: "2026-12-31", image: "/images/missions/m13.jpg" },
  { id: "r-005", name: "Charmiss Perfect Heart Matte Cushion", category: "face", points: 1500, stock: 5, cover: ["#FEF3C7", "#FDE68A"], description: "คุชชั่นเนื้อแมตต์ ปกปิดเนียน ติดทนตลอดวัน", conditions: ["แลกได้ 1 ชิ้นต่อสมาชิก"], redeem_start: "2026-11-01", redeem_end: "2026-12-31", image: "/images/missions/m10.jpg" },
  { id: "r-006", name: "Brookie Brow Slim Pencil", category: "eyes", points: 250, stock: 0, cover: ["#F3F4F6", "#E5E7EB"], description: "ดินสอเขียนคิ้วหัวเล็ก เขียนง่าย", conditions: ["แลกได้ 2 ชิ้นต่อสมาชิก"], redeem_start: "2026-11-01", redeem_end: "2026-12-31" },
];
