/** สิทธิพิเศษ (ต้นฉบับ: product-privilage + privilage/detail) */
export type Privilege = {
  id: string;
  title: string;
  points: number;
  /** สิทธิ์คงเหลือ (ต้นฉบับ reward.limit) */
  remaining: number;
  total: number;
  redeem_start: string;
  redeem_end: string;
  cover: [string, string];
  /** รูปตัวอย่าง (จากภารกิจจริงของ Charmiss Club ใน public/images/missions) — ไม่มี = ภาพไล่สี */
  image?: string;
  description: string;
  conditions: string[];
  /** ป้ายหมวด (ต้นฉบับ /api/club/tag-product/get-all) */
  tag?: string;
  /** coupon → ปุ่ม "แลกคูปอง", item → "แลกสินค้า" */
  reward_type?: "item" | "coupon";
  how_to?: string[];
  more?: string;
  /** นาทีที่รหัสรับสิทธิ์หน้าร้านมีอายุ (ต้นฉบับ time_exchange, ค่าเริ่มต้น 15) */
  time_exchange?: number;
};

export const privilegeTags = [
  { id: "0", name: "ทั้งหมด" },
  { id: "item", name: "สินค้าชิ้นเดียว" },
  { id: "coupon", name: "coupon" },
];

export const privileges: Privilege[] = [
  { id: "p-001", title: "ใช้ 200 คะแนน แลกรับ Crystal Cube ฟรี! 1 ชิ้น มูลค่า 399.-", points: 200, remaining: 1, total: 1, redeem_start: "2026-11-01", redeem_end: "2026-12-31", cover: ["#FCD6E2", "#F1336E"], description: "ของขวัญวันเกิดสำหรับสมาชิก", conditions: ["รับได้ในเดือนเกิด"], tag: "item", reward_type: "item", how_to: ["กดแลกสิทธิ์ในเดือนเกิด", "แสดงรหัสที่หน้าร้าน"], image: "/images/figma/privilege-1.png" },
  { id: "p-002", title: "ใช้ 200 คะแนน แลกรับ Glitter Lip Gloss ฟรี! 1 ชิ้น มูลค่า 399.-", points: 200, remaining: 6, total: 20, redeem_start: "2026-11-01", redeem_end: "2026-12-10", cover: ["#E4DCFF", "#7650FF"], description: "เวิร์กช็อปแต่งหน้า 2 ชั่วโมง ที่ Charmiss Siam", conditions: ["1 สิทธิ์ต่อสมาชิก", "ต้องจองล่วงหน้า 3 วัน"], tag: "item", reward_type: "item", how_to: ["กดแลกสิทธิ์", "เลือกรับที่หน้าร้าน", "แสดงรหัสกับพนักงานในวันเวิร์กช็อป"], more: "รับจำนวนจำกัด 20 ที่นั่ง", image: "/images/figma/privilege-2.png" },
  { id: "p-003", title: "ส่วนลด 20% Member Day", points: 150, remaining: 50, total: 100, redeem_start: "2026-11-15", redeem_end: "2026-11-30", cover: ["#FFE9CC", "#FF9300"], description: "ส่วนลดพิเศษวันสมาชิก", conditions: ["ใช้ได้ทุกช่องทาง"], tag: "coupon", reward_type: "coupon", how_to: ["กดแลกคูปอง", "คูปองจะอยู่ในเมนูคูปองของฉัน"], image: "/images/missions/m15.png" },
  { id: "p-004", title: "Charmiss Beauty Box (Limited)", points: 2000, remaining: 0, total: 30, redeem_start: "2026-11-01", redeem_end: "2026-12-31", cover: ["#FFF1F5", "#FCD6E2"], description: "กล่องรวมไอเทมขายดี 5 ชิ้น", conditions: ["1 สิทธิ์ต่อสมาชิก"], tag: "item", reward_type: "item", image: "/images/missions/m07.jpg" },
];
