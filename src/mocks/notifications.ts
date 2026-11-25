/**
 * การแจ้งเตือน — Figma "Noti" (400:7351)
 * ข้อความเก็บเป็น key + params แล้วแปลตอนแสดง (สลับภาษาได้) → `noti.<key>` ใน src/i18n/pages/noti.*.json
 * - type: แท็บที่รายการนี้อยู่ ("other" = แสดงเฉพาะแท็บ "ทั้งหมด")
 * - icon: ไอคอนในวงกลม 24px ตาม Figma (gift / star / bell / megaphone)
 * - link: path ใต้ /:partner ที่แตะแล้วไป (ไม่มี = แตะไม่ได้)
 * - ref: กันสร้างซ้ำ (เช่น `<id ประวัติการแลก>:shipping`)
 */
export type NotificationType = "redeem" | "mission" | "other";
export type NotificationIcon = "gift" | "star" | "bell" | "megaphone";
export type AppNotification = {
  id: string;
  key: string;
  params?: Record<string, string | number>;
  date: string;
  type: NotificationType;
  icon: NotificationIcon;
  read: boolean;
  link?: string;
  ref?: string;
};

/** ตัวอย่างตั้งต้นตามข้อความใน Figma (สร้างจริงจากแอปเฉพาะการแลก + สถานะจัดส่ง) */
export const notifications: AppNotification[] = [
  { id: "n-001", key: "delivered", params: { name: "Glow Setting Powder Translucent" }, date: "2026-11-18T10:54:00+07:00", type: "redeem", icon: "gift", read: false, link: "rewards" },
  { id: "n-002", key: "seed_mission_done", params: { mission: "ซื้อ Crystal Cube 7 ชิ้น" }, date: "2026-11-17T10:54:00+07:00", type: "mission", icon: "star", read: false, link: "missions" },
  { id: "n-003", key: "seed_platform_connected", params: { platform: "Shopee" }, date: "2026-11-16T10:54:00+07:00", type: "other", icon: "bell", read: true, link: "profile/platforms" },
  { id: "n-004", key: "seed_welcome", date: "2026-11-15T10:54:00+07:00", type: "other", icon: "bell", read: true },
  { id: "n-005", key: "seed_welcome_coupon", params: { code: "WELCOME100" }, date: "2026-11-15T10:53:00+07:00", type: "other", icon: "bell", read: true, link: "rewards?type=mine" },
  { id: "n-006", key: "seed_campaign", params: { campaign: "ช้อปปิ้งสุดมันส์", points: 500 }, date: "2026-11-12T10:54:00+07:00", type: "other", icon: "megaphone", read: true },
  { id: "n-007", key: "seed_level_up", params: { level: "Charmiss Radiance" }, date: "2026-11-10T10:54:00+07:00", type: "other", icon: "megaphone", read: true, link: "home" },
];
