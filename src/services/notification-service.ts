import { session, sessionActions } from "~/lib/session";
import type { AppNotification } from "~/mocks/notifications";
import { pointsExpire } from "~/prototype/settings";
import { expiringPoints } from "~/services/history-service";

/** เวลาตรวจใบเสร็จในต้นแบบ (จริง ~48 ชม.) */
const RECEIPT_REVIEW_MS = 60_000;

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
  list: (filter: "all" | "earn" | "mission" | "redeem"): AppNotification[] =>
    filter === "all" ? session.notifications : session.notifications.filter((n) => n.type === filter),

  /** งานตามเวลา (เรียกตอนเปิดแอป + ทุก 15 วิ): สถานะจัดส่ง · ผลตรวจใบเสร็จ · คะแนนใกล้หมดอายุ */
  syncTimed(now = Date.now()) {
    notificationService.syncDelivery(now);
    // ใบเสร็จ (ถ่ายรูป) — จริงใช้เวลาตรวจ ~48 ชม. · prototype ย่อเหลือ 1 นาที แล้วอนุมัติ (ได้คะแนน + แจ้งเตือนสะสมคะแนน)
    for (const r of session.receiptReviews) {
      if (r.status === "pending" && new Date(r.submitted_at).getTime() + RECEIPT_REVIEW_MS <= now) sessionActions.approveReceiptReview(r.id);
    }
    // คะแนนใกล้หมดอายุ (เมื่อเปิดโหมดคะแนนมีวันหมดอายุ) — ก้อนที่หมดภายใน 30 วัน แจ้งครั้งเดียวต่อก้อน · แท็บ "ทั้งหมด"
    if (pointsExpire()) {
      const soon = expiringPoints().find((e) => {
        const at = new Date(`${e.id.slice(4)}T23:59:59+07:00`).getTime();
        return at >= now && at - now <= 30 * 86_400_000;
      });
      if (soon) sessionActions.pushNotification({ key: "points_expiring", params: { text: soon.title }, type: "other", icon: "bell", link: "wallet/points-history?filter=expired", ref: soon.id });
    }
  },

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
