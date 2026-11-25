/**
 * รายการหน้าของ prototype — ใช้ในหน้า hub (/) และเมนู prototype
 * status: "done" = สร้างแล้ว, "planned" = อยู่ในแผน (ช่วงที่ 4), "skip" = ไม่ทำ
 * path เขียนแบบไม่มี partner (จะเติม /charmiss ให้อัตโนมัติ)
 */
export type ScreenStatus = "done" | "planned" | "skip";
export type Screen = { path: string; title: string; status: ScreenStatus; note?: string };
export type ScreenGroup = { title: string; screens: Screen[] };

export const screenGroups: ScreenGroup[] = [
  {
    title: "เข้าสู่ระบบ / สมัครสมาชิก",
    screens: [
      { path: "welcome", title: "หน้าต้อนรับ + ปุ่ม LINE", status: "done" },
      { path: "auth/member-check", title: "เคยเป็นสมาชิกแล้วหรือยัง?", status: "done" },
      { path: "auth/verify-phone?action=merge", title: "ยืนยันเบอร์โทร + OTP", status: "done" },
      { path: "auth/register", title: "สมัครสมาชิก", status: "done" },
      { path: "auth/consent", title: "ข้อตกลงและความยินยอม", status: "done" },
    ],
  },
  {
    title: "หน้าหลักและภารกิจ",
    screens: [
      { path: "home", title: "หน้าแรกสมาชิก", status: "done" },
      { path: "missions", title: "รายการภารกิจ", status: "done" },
      { path: "missions/m-001", title: "รายละเอียดภารกิจ (แสตมป์)", status: "done" },
      { path: "missions/m-004", title: "รายละเอียดภารกิจ (สำเร็จแล้ว)", status: "done" },
      { path: "missions/m-004/rewards/r-005", title: "โค้ดรางวัลภารกิจ", status: "done" },
      { path: "missions/m-002/quiz", title: "ภารกิจตอบคำถาม", status: "done" },
      { path: "missions/m-001/leaderboard", title: "อันดับคอยน์", status: "done" },
      { path: "earn", title: "สะสมคะแนน", status: "done" },
      { path: "earn/receipt-example", title: "ตัวอย่างเลขที่ใบเสร็จ", status: "done" },
      { path: "earn/receipt", title: "กรอกเลขที่ใบเสร็จ", status: "done" },
      { path: "earn/product-code", title: "กรอกรหัสสินค้า", status: "done" },
    ],
  },
  {
    title: "รางวัล คูปอง สิทธิพิเศษ",
    screens: [
      { path: "rewards?type=coupons", title: "แลกคูปอง", status: "done" },
      { path: "rewards?type=mine", title: "คูปองของฉัน", status: "done" },
      { path: "rewards/r-001", title: "รายละเอียดรางวัล", status: "done" },
      { path: "rewards/r-001/checkout", title: "สรุปก่อนแลก", status: "done" },
      { path: "rewards?type=coupons", title: "แลกคูปอง", status: "done" },
      { path: "wallet/coupons/c-001", title: "รายละเอียดคูปอง", status: "done" },
      { path: "rewards", title: "สิทธิพิเศษ", status: "done" },
      { path: "rewards/p-002", title: "รายละเอียดสิทธิพิเศษ", status: "done" },
    ],
  },
  {
    title: "บัญชีผู้ใช้",
    screens: [
      { path: "profile", title: "โปรไฟล์", status: "done" },
      { path: "profile/info", title: "ข้อมูลส่วนตัว", status: "done" },
      { path: "profile/tier", title: "ระดับสมาชิก", status: "done" },
      { path: "profile/addresses", title: "ที่อยู่", status: "done" },
      { path: "profile", title: "การตั้งค่า", status: "done" },
      { path: "profile/privacy", title: "นโยบายคุ้มครองข้อมูลส่วนบุคคล", status: "done" },
      { path: "wallet/history", title: "ประวัติการแลก", status: "done" },
      { path: "wallet/redemptions", title: "การแลกรางวัลของฉัน", status: "done" },
      { path: "wallet/history?type=coins", title: "ประวัติคอยน์ / คะแนน", status: "done" },
      { path: "notifications", title: "การแจ้งเตือน", status: "done" },
      { path: "profile/platforms", title: "เชื่อมต่อแพลตฟอร์มออนไลน์", status: "done" },
      { path: "profile/platforms/lazada", title: "ยืนยันบัญชีแพลตฟอร์ม (Lazada)", status: "done" },
      { path: "rewards/points-to-coupon", title: "แลกคะแนน", status: "done" },
    ],
  },
];
