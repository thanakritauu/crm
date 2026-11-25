/** ข้อมูลจำลองของสมาชิกที่ล็อกอิน (ต้นฉบับ: customer-service / customer_event_point) */
export type Customer = {
  id: string;
  /** รหัสสมาชิกที่แสดงบนการ์ด (เช่น charmiss00000005) */
  member_code: string;
  line_display_name: string;
  name: string;
  surname: string;
  phone: string;
  email: string;
  birthday: string; // YYYY-MM-DD
  gender: "female" | "male" | "unspecified";
  id_card?: string;
  profile_image: string;
  tier: string;
  member_since: string;
  /** คะแนน (point) — ใช้แลกรางวัล / สิทธิพิเศษ */
  points: number;
  /** คอยน์ — ได้จากภารกิจ */
  coins: number;
  stats: { monthly_points: number; checkin_streak: number; owner_shop: string };
  address: Address;
};

export type Address = {
  detail: string;
  province: string;
  district: string;
  sub_district: string;
  zipcode: string;
};

export const customer: Customer = {
  id: "cus-0001",
  member_code: "charmiss00001234",
  line_display_name: "Ploy 🌸",
  name: "พลอย",
  surname: "ใจดี",
  phone: "0812345678",
  email: "ploy@example.com",
  birthday: "1998-03-14",
  gender: "female",
  profile_image: "/images/figma/home-avatar.png",
  tier: "Pink Member",
  member_since: "2025-06-01",
  points: 1250,
  coins: 320,
  stats: { monthly_points: 180, checkin_streak: 4, owner_shop: "Charmiss Siam" },
  address: {
    detail: "99/9 ซอยสุขุมวิท 21",
    province: "กรุงเทพมหานคร",
    district: "วัฒนา",
    sub_district: "คลองเตยเหนือ",
    zipcode: "10110",
  },
};
