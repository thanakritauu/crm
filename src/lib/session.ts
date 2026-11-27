import { emitEarned } from "~/components/layout/fly-to-home";
import { translate } from "~/lib/i18n";
import { createStore, produce } from "solid-js/store";
import { customer as initialCustomer, type Customer } from "~/mocks/customer";
import { myCoupons as initialCoupons, couponCatalog, COUPON_CODE_VALID_MINUTES, type Coupon } from "~/mocks/coupons";
import { redeemHistory as initialRedeem, pointHistory as initialPointHistory, coinHistory as initialCoinHistory, type RedeemRecord, type PointTransaction } from "~/mocks/history";
import { notifications as initialNotifications, type AppNotification } from "~/mocks/notifications";
import { rewards } from "~/mocks/rewards";
import { privileges } from "~/mocks/privileges";

/**
 * สถานะจำลองของผู้ใช้ (แทน backend) — เก็บใน localStorage เพื่อให้คลิกต่อเนื่องได้
 * ต้นฉบับ: ข้อมูลมาจาก API ผ่าน services/* และ cookie/LINE session
 * กด "รีเซ็ตข้อมูลจำลอง" ในเมนู prototype เพื่อเริ่มใหม่
 */
type SessionState = {
  loggedIn: boolean;
  isMember: boolean;
  customer: Customer;
  myCoupons: Coupon[];
  redeemHistory: RedeemRecord[];
  pointHistory: PointTransaction[];
  coinHistory: PointTransaction[];
  notifications: AppNotification[];
  language: "th" | "en";
};

const STORAGE_KEY = "charmiss-prototype-session-v2";

const initialState = (): SessionState => ({
  loggedIn: true,
  isMember: true,
  customer: structuredClone(initialCustomer),
  myCoupons: structuredClone(initialCoupons),
  redeemHistory: structuredClone(initialRedeem),
  pointHistory: structuredClone(initialPointHistory),
  coinHistory: structuredClone(initialCoinHistory),
  notifications: structuredClone(initialNotifications),
  language: "th",
});

const [session, setSession] = createStore<SessionState>(initialState());
export { session };

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* private mode ฯลฯ — ใช้ค่าในหน่วยความจำต่อ */
  }
}

/** เรียกครั้งเดียวหลัง mount (ฝั่ง client) เพื่อโหลดสถานะที่เคยบันทึก */
export function restoreSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      const base = initialState();
      // รวม customer แบบลึก เพื่อให้ฟิลด์ใหม่ใน mock ไม่หายเมื่อมีข้อมูลเก่าใน localStorage
      // การแจ้งเตือนแบบเก่า (ไม่มี key) → ใช้ชุดตั้งต้นใหม่
      const notis = Array.isArray(saved.notifications) && saved.notifications.every((n: AppNotification) => n.key) ? saved.notifications : base.notifications;
      const customer = { ...base.customer, ...saved.customer };
      // รูปโปรไฟล์ตั้งต้นเดิม (ไอคอนผู้ใช้แบบรูป) → ใช้รูปจำลองใหม่ ให้หน้าแรกกับโปรไฟล์ตรงกัน
      if (customer.profile_image === "/images/default-profile.png") customer.profile_image = base.customer.profile_image;
      // รหัสสมาชิกแก้ไม่ได้ → ใช้ค่าจาก mock เสมอ (รูปแบบ charmiss000000005)
      customer.member_code = base.customer.member_code;
      setSession({ ...base, ...saved, notifications: notis, customer });
    }
    sessionActions.expireCoupons();
  } catch {
    /* ignore */
  }
}

export function resetSession() {
  setSession(initialState());
  persist();
}

const now = () => new Date().toISOString();

/** ข้อความประวัติ: string (ข้อความตรง) หรือ { key, params } (แปลตามภาษาตอนแสดง — ดู txText) */
export type HistoryMsg = string | { key: string; params?: Record<string, string | number> };
/** แปลง HistoryMsg เป็นฟิลด์ของ PointTransaction (title สำรองเป็นภาษาไทยตอนบันทึก) */
function msgFields(title: HistoryMsg, source: HistoryMsg) {
  const tt = typeof title === "string" ? { title } : { title: translate(title.key, title.params), key: title.key, params: title.params };
  const ss = typeof source === "string" ? { source } : { source: translate(source.key), source_key: source.key };
  return { ...tt, ...ss };
}

/** เพิ่มการแจ้งเตือน (ใหม่สุดอยู่บน) · ref ซ้ำ = ไม่เพิ่ม — เรียกภายใน produce */
function addNotification(s: SessionState, n: Omit<AppNotification, "id" | "read" | "date"> & { date?: string }) {
  if (n.ref && s.notifications.some((x) => x.ref === n.ref)) return;
  const item: AppNotification = { ...n, id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, date: n.date ?? now(), read: false };
  // เรียงตามวันที่ (สถานะจัดส่งที่ย้อนเติมทีหลังจะเข้าตำแหน่งตามเวลา)
  const t = new Date(item.date).getTime();
  const i = s.notifications.findIndex((x) => new Date(x.date).getTime() <= t);
  if (i === -1) s.notifications.push(item);
  else s.notifications.splice(i, 0, item);
}
const randomCode = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

export const sessionActions = {
  login() {
    setSession("loggedIn", true);
    persist();
  },
  logout() {
    setSession("loggedIn", false);
    persist();
  },
  /**
   * เข้าแบบ Guest (Figma Home_Guest mode): บัญชีใหม่ยังไม่สมัครสมาชิก — คะแนน 0 ไม่มีประวัติ/คูปอง
   * คะแนนที่สะสมระหว่างเป็น Guest ยังอยู่เมื่อสมัครสมาชิกภายหลัง
   */
  enterGuest() {
    const base = initialState();
    setSession({
      ...base,
      loggedIn: true,
      isMember: false,
      customer: { ...base.customer, name: "", surname: "", phone: "", email: "", birthday: "", points: 0 },
      myCoupons: [],
      pointHistory: [],
      coinHistory: [],
      redeemHistory: [],
      language: session.language,
    });
    persist();
  },
  setMember(isMember: boolean) {
    setSession("isMember", isMember);
    persist();
  },
  updateCustomer(patch: Partial<Customer>) {
    setSession("customer", (c) => ({ ...c, ...patch }));
    persist();
  },
  setLanguage(language: "th" | "en") {
    setSession("language", language);
    persist();
  },
  markNotificationsRead() {
    if (!session.notifications.some((n) => !n.read)) return;
    setSession("notifications", (n) => !n.read, "read", true);
    persist();
  },

  /** เพิ่มการแจ้งเตือนจากภายนอก (notification-service / เมนู prototype) */
  pushNotification(n: Omit<AppNotification, "id" | "read" | "date"> & { date?: string }) {
    if (n.ref && session.notifications.some((x) => x.ref === n.ref)) return;
    setSession(produce((s) => addNotification(s, n)));
    persist();
  },

  /** เมนู prototype: ล้างทั้งหมด (ดูสถานะว่าง) / กลับเป็นชุดตั้งต้น */
  setNotifications(list: "empty" | "seed") {
    setSession("notifications", list === "empty" ? [] : structuredClone(initialNotifications));
    persist();
  },

  /** แลกของรางวัลด้วยคะแนน — คืน false ถ้าคะแนนไม่พอหรือของหมด */
  redeemReward(rewardId: string, address?: RedeemRecord["address"]): boolean {
    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward || reward.stock <= 0 || session.customer.points < reward.points) return false;
    setSession(
      produce((s) => {
        s.customer.points -= reward.points;
        s.redeemHistory.unshift({ id: `rh-${Date.now()}`, name: reward.name, points: reward.points, date: now(), status: "pending", kind: "reward", address });
        addNotification(s, { key: "redeem_reward", params: { name: reward.name, points: reward.points }, type: "redeem", icon: "gift", link: `rewards/${reward.id}` });
        s.pointHistory.unshift({ id: `ph-${Date.now()}`, amount: -reward.points, date: now(), ...msgFields({ key: "hist.used_points", params: { points: reward.points, name: reward.name } }, { key: "hist.src_reward" }) });
      }),
    );
    persist();
    return true;
  },

  /** แลกคูปองด้วยคะแนน — คืนคูปองใหม่ หรือ undefined ถ้าคะแนนไม่พอ */
  redeemCoupon(couponId: string): Coupon | undefined {
    const c = couponCatalog.find((x) => x.id === couponId);
    if (!c || session.customer.points < c.points) return undefined;
    const coupon: Coupon = { ...c, id: `c-${Date.now()}`, code: randomCode("CHM"), status: "available" };
    setSession(
      produce((s) => {
        s.customer.points -= c.points;
        s.myCoupons.unshift(coupon);
        s.redeemHistory.unshift({ id: `rh-${Date.now()}`, name: c.title, points: c.points, date: now(), status: "completed", kind: "coupon" });
        addNotification(s, { key: "redeem_coupon", params: { name: c.title, points: c.points }, type: "redeem", icon: "gift", link: `wallet/coupons/${coupon.id}` });
        s.pointHistory.unshift({ id: `ph-${Date.now()}`, amount: -c.points, date: now(), ...msgFields({ key: "hist.used_points", params: { points: c.points, name: c.title } }, { key: "hist.src_coupon" }) });
      }),
    );
    persist();
    return coupon;
  },

  /**
   * แลกคะแนนเป็นคูปองส่วนลด (หน้า exchange-point) — ตัดคะแนน, เพิ่มคูปองใน "คูปองของฉัน" และประวัติคะแนน
   * (ประวัติการแลกของรายการนี้เก็บใน history-service)
   */
  exchangePointsToCoupon(points: number, discount: number, code: string, validityDays = 30) {
    const expires = new Date(Date.now() + validityDays * 86_400_000).toISOString().slice(0, 10);
    const couponId = `c-ex-${Date.now()}`;
    setSession(
      produce((s) => {
        s.customer.points -= points;
        addNotification(s, { key: "redeem_coupon", params: { name: `คูปองส่วนลด ฿${discount}`, points }, type: "redeem", icon: "gift", link: `wallet/coupons/${couponId}` });
        s.myCoupons.unshift({
          id: couponId,
          title: `คูปองส่วนลด ฿${discount}`,
          discount: `฿${discount}`,
          description: "คูปองจากการแลกคะแนน",
          code,
          points,
          expires_at: expires,
          status: "available",
          cover: ["#FFE9CC", "#FF9300"],
          conditions: ["ใช้ได้ 1 ครั้ง"],
        });
        s.pointHistory.unshift({ id: `ph-${Date.now()}`, amount: -points, date: now(), ...msgFields({ key: "hist.used_points_discount", params: { points, discount } }, { key: "hist.src_coupon" }) });
      }),
    );
    persist();
  },

  /** ใช้คูปอง (ที่หน้าร้าน) */
  /** กดยืนยันใช้คูปอง → ใช้งานแล้วทันที · ดูรหัสซ้ำได้อีก 10 นาที */
  useCoupon(couponId: string) {
    const now = new Date();
    const expires = new Date(now.getTime() + COUPON_CODE_VALID_MINUTES * 60_000);
    setSession("myCoupons", (c) => c.id === couponId, (c) => ({ ...c, status: "used" as const, used_at: now.toISOString(), code_expires_at: expires.toISOString() }));
    persist();
  },

  /** คูปองพร้อมใช้ที่เลยวันหมดอายุ (สิ้นวัน expires_at) → หมดอายุ */
  expireCoupons() {
    const now = Date.now();
    const isPast = (c: Coupon) => c.status === "available" && new Date(`${c.expires_at.slice(0, 10)}T23:59:59+07:00`).getTime() < now;
    if (!session.myCoupons.some(isPast)) return;
    setSession("myCoupons", isPast, "status", "expired");
    persist();
  },

  /** เมนู prototype: สลับข้อมูลคูปองเพื่อดู 3 สถานะของส่วน "คูปองของฉัน" ในหน้าแรก (Figma Logic box) */
  setCouponScenario(scenario: "has" | "all_used" | "none") {
    const base = structuredClone(initialCoupons);
    const list =
      scenario === "none" ? [] : scenario === "all_used" ? base.map((c) => (c.status === "available" ? { ...c, status: "used" as const } : c)) : base;
    setSession("myCoupons", list);
    persist();
  },

  /** แลกสิทธิพิเศษ */
  /** แลกสิทธิพิเศษ → คืน id รายการประวัติการแลก (false = แลกไม่ได้) */
  redeemPrivilege(privilegeId: string, opts: Pick<RedeemRecord, "method" | "address" | "code"> = {}): string | false {
    const p = privileges.find((x) => x.id === privilegeId);
    if (!p || p.remaining <= 0 || session.customer.points < p.points) return false;
    const recordId = `rh-${Date.now()}`;
    const couponId = `c-pv-${Date.now()}`;
    setSession(
      produce((s) => {
        s.customer.points -= p.points;
        s.redeemHistory.unshift({
          id: recordId,
          name: p.title,
          points: p.points,
          date: now(),
          status: opts.method === "delivery" ? "pending" : "completed",
          kind: "privilege",
          privilege_id: p.id,
          ...opts,
        });
        // แจ้งเตือนการแลก (จัดส่งถึงบ้าน: ขั้นถัดไป "นำส่ง/ได้รับแล้ว" เติมโดย notificationService.syncDelivery)
        const detail = `rewards/${p.id}?redeem=${recordId}`;
        if (p.reward_type === "coupon")
          addNotification(s, { key: "redeem_coupon", params: { name: p.title, points: p.points }, type: "redeem", icon: "gift", link: `wallet/coupons/${couponId}`, ref: recordId });
        else if (opts.method === "delivery")
          addNotification(s, { key: "preparing", params: { name: p.title, points: p.points }, type: "redeem", icon: "gift", link: detail, ref: `${recordId}:preparing` });
        else addNotification(s, { key: "redeem_pickup", params: { name: p.title, points: p.points }, type: "redeem", icon: "gift", link: detail, ref: recordId });
        if (p.points > 0)
          s.pointHistory.unshift({ id: `ph-${Date.now()}`, amount: -p.points, date: now(), ...msgFields({ key: "hist.used_points", params: { points: p.points, name: p.title } }, { key: "hist.src_privilege" }) });
        // สิทธิ์ประเภทคูปอง → เข้า "คูปองของฉัน"
        if (p.reward_type === "coupon")
          s.myCoupons.unshift({
            id: couponId,
            title: p.title,
            discount: p.title.match(/\d+%/)?.[0] ? `-${p.title.match(/\d+%/)![0]}` : "COUPON",
            description: p.description,
            code: randomCode("PRV"),
            points: p.points,
            expires_at: p.redeem_end,
            status: "available",
            cover: p.cover,
            conditions: p.conditions,
          });
      }),
    );
    persist();
    return recordId;
  },

  /** ได้รับคะแนน (สะสมคะแนน) + บันทึกประวัติคะแนน */
  addPoints(amount: number, title: HistoryMsg, source: HistoryMsg) {
    setSession(
      produce((s) => {
        s.customer.points += amount;
        s.pointHistory.unshift({ id: `ph-${Date.now()}`, amount, date: now(), ...msgFields(title, source) });
      }),
    );
    persist();
    // เหรียญ P ปลิวไปที่ยอดคะแนนหน้าสะสมคะแนน (ถ้าอยู่หน้านั้น) ไม่งั้นปุ่มหน้าแรก
    emitEarned("points", amount, "points");
  },

  /** ได้รับคอยน์จากภารกิจ */
  /** ลงประวัติคอยน์ของภารกิจสะสมคอยน์ (คอยน์อยู่ในภารกิจ ไม่เปลี่ยนยอดคอยน์รวม) */
  logCoins(amount: number, title: HistoryMsg) {
    setSession(
      produce((s) => {
        s.coinHistory.unshift({ id: `ch-${Date.now()}`, amount, date: now(), ...msgFields(title, { key: "hist.src_mission" }) });
      }),
    );
    persist();
  },
  addCoins(amount: number, title: HistoryMsg) {
    setSession(
      produce((s) => {
        s.customer.coins += amount;
        s.coinHistory.unshift({ id: `ch-${Date.now()}`, amount, date: now(), ...msgFields(title, { key: "hist.src_mission" }) });
      }),
    );
    persist();
    // เหรียญ C ปลิวไปที่ยอดคอยน์หน้าภารกิจ (ถ้าอยู่หน้านั้น) ไม่งั้นปุ่ม "ภารกิจ" ในเมนูล่าง — ไม่ไปหน้าแรก (2026-11-27)
    emitEarned("coins", amount, "coins");
  },
};
