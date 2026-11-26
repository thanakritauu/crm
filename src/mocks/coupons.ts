/** คูปอง (ต้นฉบับ: coupon-service, MyCoupon) */
export type CouponStatus = "available" | "used" | "expired";
export type Coupon = {
  id: string;
  title: string;
  /** ข้อความส่วนลดตัวใหญ่บนการ์ด */
  discount: string;
  description: string;
  code: string;
  points: number;
  expires_at: string;
  status: CouponStatus;
  cover: [string, string];
  /** รูปตัวอย่าง (จากภารกิจจริงของ Charmiss Club ใน public/images/missions) — ไม่มี = ภาพไล่สี */
  image?: string;
  conditions: string[];
  /** แท็บ "การใช้คูปอง" ในหน้า detail (ต้นฉบับ coupon_info.how_to) */
  how_to?: string[];
  /** แท็บ "เพิ่มเติม" (ต้นฉบับ coupon_info.more) */
  more?: string;
  /** วันเริ่มใช้ได้ (ต้นฉบับ valid_from / reward_info.start_use) */
  valid_from?: string;
  /** เวลาที่กดยืนยันใช้คูปอง */
  used_at?: string;
  /** รหัสใช้คูปองดูซ้ำได้ถึงเวลานี้ (ยืนยัน + 10 นาที) */
  code_expires_at?: string;
};

/** อายุรหัสหลังกดยืนยันใช้คูปอง (นาที) — ตามข้อความยืนยันใน Figma "หมดอายุภายใน 10 นาที" */
export const COUPON_CODE_VALID_MINUTES = 10;

/** อายุรหัสใช้คูปองหน้าร้าน (นาที) — ต้นฉบับมาจาก code_settings ของแคตตาล็อก */
export const COUPON_CODE_EXPIRE_MINUTES = 15;

/** คูปองที่แลกได้ (หน้า /coupon) */
export const couponCatalog: Coupon[] = [
  { id: "c-101", title: "ส่วนลด 15% ทุกรายการ", discount: "-15%", description: "ใช้ได้ที่ Charmiss Official Store บน Shopee", code: "", points: 200, expires_at: "2026-12-31", status: "available", cover: ["#FCD6E2", "#F1336E"], conditions: ["ขั้นต่ำ 500 บาท", "ใช้ได้ 1 ครั้ง"], image: "/images/missions/m01.jpg" },
  { id: "c-102", title: "ลด 100 บาท", discount: "฿100", description: "ใช้ได้ที่หน้าร้าน Charmiss ทุกสาขา", code: "", points: 300, expires_at: "2026-12-31", status: "available", cover: ["#FFE9CC", "#FF9300"], conditions: ["ขั้นต่ำ 799 บาท"], image: "/images/missions/m02.jpg" },
  { id: "c-103", title: "ส่งฟรี", discount: "FREE", description: "ส่งฟรีไม่มีขั้นต่ำ บน Lazada", code: "", points: 80, expires_at: "2026-11-30", status: "available", cover: ["#E4DCFF", "#7650FF"], conditions: ["ใช้ได้ 1 ครั้ง"], image: "/images/missions/m15.png" },
];

/** คูปองของฉัน (หน้า /coupon/my-coupons) */
export const myCoupons: Coupon[] = [
  // ชื่อ/รูป/เงื่อนไขตาม Figma My Coupon (583:1108)
  { id: "c-001", title: "คูปอง Starbuck", discount: "FREE", description: "รับเครื่องดื่มสตาบัคฟรี ประเภทใดก็ได้ 1 แก้ว", code: "AA8576958430", points: 0, valid_from: "2026-11-01", expires_at: "2026-12-31", status: "available", cover: ["#E0F2FE", "#7DD3FC"], image: "/images/figma/coupon-starbucks.png", conditions: ["สิทธิพิเศษนี้มีจำนวนจำกัด 20,000 สิทร์ / เดือน", "สำหรับลูกค้าชาร์มิสเท่านั้น", "ไม่สามารถรับสิทธิ์ได้จากการแสดงภาพที่บันทึกบนหน้าจอโทรศัพท์", "กรณีทำรายการแลกพอยท์แล้วไม่สามารกยกเลิกได้ทุกกรณี", "ไม่สามารถแลกเปลี่ยนหรือทอนเป็นเงินสดได้", "ไม่สามารถใช้ร่วมกับรายการส่งเสริมการขายอื่นๆได้"] },
  { id: "c-002", title: "คูปอง Lazada", discount: "-15%", description: "ส่วนลด 15% สำหรับสินค้า Charmiss บน Lazada", code: "LZ15CHM2026", points: 200, valid_from: "2026-11-01", expires_at: "2026-11-29", status: "available", cover: ["#FCE7F3", "#FBCFE8"], image: "/images/figma/coupon-icecream.png", conditions: ["สิทธิพิเศษนี้มีจำนวนจำกัด 20,000 สิทร์ / เดือน", "สำหรับลูกค้าชาร์มิสเท่านั้น", "ไม่สามารถรับสิทธิ์ได้จากการแสดงภาพที่บันทึกบนหน้าจอโทรศัพท์", "กรณีทำรายการแลกพอยท์แล้วไม่สามารกยกเลิกได้ทุกกรณี", "ไม่สามารถแลกเปลี่ยนหรือทอนเป็นเงินสดได้", "ไม่สามารถใช้ร่วมกับรายการส่งเสริมการขายอื่นๆได้"] },
  { id: "c-003", title: "คูปอง Starbuck", discount: "FREE", description: "รับเครื่องดื่มสตาบัคฟรี ประเภทใดก็ได้ 1 แก้ว", code: "AA1234567890", points: 0, valid_from: "2026-09-01", expires_at: "2026-12-31", status: "used", cover: ["#E5E7EB", "#9CA3AF"], image: "/images/figma/coupon-starbucks.png", conditions: ["สิทธิพิเศษนี้มีจำนวนจำกัด 20,000 สิทร์ / เดือน", "สำหรับลูกค้าชาร์มิสเท่านั้น", "ไม่สามารถรับสิทธิ์ได้จากการแสดงภาพที่บันทึกบนหน้าจอโทรศัพท์", "กรณีทำรายการแลกพอยท์แล้วไม่สามารกยกเลิกได้ทุกกรณี", "ไม่สามารถแลกเปลี่ยนหรือทอนเป็นเงินสดได้", "ไม่สามารถใช้ร่วมกับรายการส่งเสริมการขายอื่นๆได้"] },
  { id: "c-004", title: "คูปอง Lazada", discount: "-15%", description: "ส่วนลด 15% สำหรับสินค้า Charmiss บน Lazada", code: "LZ15OLD", points: 200, valid_from: "2026-08-01", expires_at: "2026-10-01", status: "expired", cover: ["#E5E7EB", "#9CA3AF"], image: "/images/figma/coupon-icecream.png", conditions: ["สิทธิพิเศษนี้มีจำนวนจำกัด 20,000 สิทร์ / เดือน", "สำหรับลูกค้าชาร์มิสเท่านั้น", "ไม่สามารถรับสิทธิ์ได้จากการแสดงภาพที่บันทึกบนหน้าจอโทรศัพท์", "กรณีทำรายการแลกพอยท์แล้วไม่สามารกยกเลิกได้ทุกกรณี", "ไม่สามารถแลกเปลี่ยนหรือทอนเป็นเงินสดได้", "ไม่สามารถใช้ร่วมกับรายการส่งเสริมการขายอื่นๆได้"] },
];
