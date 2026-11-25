import { couponCatalog, type CouponStatus } from "~/mocks/coupons";
import { session } from "~/lib/session";

/** ต้นฉบับ: coupon-service */
export const couponService = {
  catalog: () => couponCatalog,
  getCatalogItem: (id: string) => couponCatalog.find((c) => c.id === id),
  mine: () => session.myCoupons,
  /** ต้นฉบับแบ่ง type 1 = พร้อมใช้งาน, 2 = ใช้งานแล้ว/หมดอายุ */
  mineByStatus: (statuses: CouponStatus[]) => session.myCoupons.filter((c) => statuses.includes(c.status)),
  getMine: (id: string) => session.myCoupons.find((c) => c.id === id),
};
