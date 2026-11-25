import { session, sessionActions } from "~/lib/session";
import type { AppNotification } from "~/mocks/notifications";

/**
 * การแจ้งเตือน (Figma "Noti" 400:7351)
 * - สร้างจริงจากการแลก (ใน sessionActions: แลกรางวัล / คูปอง / สิทธิพิเศษ)
 * - สถานะจัดส่งของสิทธิพิเศษแบบจัดส่งถึงบ้าน เดินเองตามเวลา (privilegeService.redeemStatus):
 *   แลก = กำลังจัดเตรียม → 1 นาที อยู่ระหว่างการนำส่ง → 3 นาที ได้รับสินค้าแล้ว
 *   syncDelivery() เติมแจ้งเตือนของขั้นที่ถึงแล้ว (วันที่ = เวลาที่ถึงขั้นนั้นจริง) — เรียกตอนเปิดแอปและทุก 15 วินาที
 */
const STEPS = [
  { key: "shipping", afterMin: 1 },
  { key: "delivered", afterMin: 3 },
] as const;

export const notificationService = {
  unreadCount: () => session.notifications.filter((n) => !n.read).length,

  /** แท็บ: "ทั้งหมด" = ทุกประเภท · ภารกิจ / การแลกสินค้า = เฉพาะประเภทนั้น */
  list: (filter: "all" | "mission" | "redeem"): AppNotification[] =>
    filter === "all" ? session.notifications : session.notifications.filter((n) => n.type === filter),

  syncDelivery(now = Date.now()) {
    for (const rec of session.redeemHistory) {
      if (rec.kind !== "privilege" || rec.method !== "delivery" || rec.status === "cancelled") continue;
      const start = new Date(rec.date).getTime();
      for (const step of STEPS) {
        const at = start + step.afterMin * 60_000;
        if (at > now) break;
        sessionActions.pushNotification({
          key: step.key,
          params: { name: rec.name },
          type: "redeem",
          icon: "gift",
          link: `rewards/${rec.privilege_id}?redeem=${rec.id}`,
          ref: `${rec.id}:${step.key}`,
          date: new Date(at).toISOString(),
        });
      }
    }
  },
};
