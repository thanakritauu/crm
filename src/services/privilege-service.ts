import type { RedeemRecord } from "~/mocks/history";
import { privileges, privilegeTags } from "~/mocks/privileges";

export type PrivilegeSort = "" | "new" | "hot" | "asc" | "desc";

/** ต้นฉบับ: product-privilage (redeem-service: type loyalty + sort + tag) */
export const privilegeService = {
  tags: () => privilegeTags,
  list: (opts: { tag?: string; sort?: PrivilegeSort } = {}) => {
    let list = !opts.tag || opts.tag === "0" ? [...privileges] : privileges.filter((p) => p.tag === opts.tag);
    // ต้นฉบับ: asc = "น้อย ไป มาก", desc = "มาก ไป น้อย"
    if (opts.sort === "asc") list.sort((a, b) => a.points - b.points);
    if (opts.sort === "desc") list.sort((a, b) => b.points - a.points);
    if (opts.sort === "new") list.sort((a, b) => b.redeem_start.localeCompare(a.redeem_start));
    if (opts.sort === "hot") list.sort((a, b) => b.total - b.remaining - (a.total - a.remaining));
    return list;
  },
  get: (id: string) => privileges.find((p) => p.id === id),

  /**
   * สถานะการแลก (Figma Reward History / Reward_Detail_Delivery / Reward_Detail_usedAt Shop)
   * - รับที่หน้าร้าน → "แลกที่ร้าน"
   * - จัดส่งถึงบ้าน → เดินเองตามเวลาหลังแลก: 0–1 นาที กำลังจัดเตรียมสินค้า · 1–3 นาที อยู่ระหว่างการนำส่ง · 3 นาทีขึ้นไป ได้รับสินค้าเรียบร้อยแล้ว
   * - รายการเก่าที่ไม่มีวิธีรับ ใช้ status เดิม
   */
  redeemStatus(rec: RedeemRecord, now = Date.now()): RedeemStatus {
    if (rec.status === "cancelled") return "cancelled";
    // สิทธิพิเศษประเภทคูปอง → เข้า "คูปองของฉัน" ทันที
    if (rec.privilege_id && privileges.find((p) => p.id === rec.privilege_id)?.reward_type === "coupon") return "coupon";
    if (rec.method === "pickup") return "picked_up";
    if (rec.method === "delivery") {
      const min = (now - new Date(rec.date).getTime()) / 60_000;
      return min < 1 ? "preparing" : min < 3 ? "shipping" : "delivered";
    }
    return rec.status === "pending" ? "preparing" : rec.status === "shipped" ? "shipping" : "delivered";
  },
};

export type RedeemStatus = "picked_up" | "coupon" | "preparing" | "shipping" | "delivered" | "cancelled";
/** key ข้อความ + โทนป้ายของแต่ละสถานะ */
export const REDEEM_STATUS: Record<RedeemStatus, { key: string; tone: "primary" | "teriary" | "secondary" | "success" | "gray" }> = {
  picked_up: { key: "priv.status_picked_up", tone: "primary" },
  coupon: { key: "priv.status_coupon", tone: "primary" },
  preparing: { key: "priv.status_preparing", tone: "teriary" },
  shipping: { key: "priv.status_shipping", tone: "secondary" },
  delivered: { key: "priv.status_delivered", tone: "success" },
  cancelled: { key: "common.cancelled", tone: "gray" },
};
