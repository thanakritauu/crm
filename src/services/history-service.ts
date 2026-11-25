import { createStore } from "solid-js/store";
import { intlLocale, translate } from "~/lib/i18n";
import { session, sessionActions } from "~/lib/session";
import { expiredPoints, type PointTransaction, type RedeemRecord } from "~/mocks/history";

/**
 * ต้นฉบับ: customer-event-point-service (ประวัติคะแนน/คอยน์), redeem-service (ประวัติการแลก),
 * และ endpoint แลกคะแนนเป็นคูปองส่วนลด (exchange-point)
 * Prototype: อ่านจาก session store + เก็บประวัติการแลกคะแนนเป็นคูปองไว้ใน store ของไฟล์นี้
 */

/** ค่า burn_settings ของการแลกคะแนนเป็นคูปอง (ต้นฉบับมาจาก API — ใช้ค่า default ในโค้ดต้นฉบับ) */
export const exchangeSettings = {
  is_enable_point_to_coupon: true,
  min_points_per_redemption: 10,
  max_points_per_redemption: 0, // 0 = ไม่จำกัด
  point_step: 10,
  points_per_unit: 10,
  discount_per_unit: 1,
  coupon_validity_days: 30,
};

export type ExchangeRecord = { id: string; code: string; discount: number; points_used: number; created_at: string };

type ExchangeState = { records: ExchangeRecord[] };
const STORAGE_KEY = "charmiss-prototype-exchange-v1";
const [exchangeState, setExchangeState] = createStore<ExchangeState>({ records: [] });
export { exchangeState };

export function restoreExchangeState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setExchangeState(JSON.parse(raw));
  } catch {
    /* ignore */
  }
}

export function resetExchangeState() {
  setExchangeState({ records: [] });
  persist();
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exchangeState));
  } catch {
    /* ignore */
  }
}

/** จัดกลุ่มรายการตามเดือน เช่น "พฤศจิกายน 2569" (เรียงใหม่ → เก่า) */
export function groupByMonth<T extends { date: string }>(items: readonly T[]): { month: string; items: T[] }[] {
  const sorted = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const groups: { month: string; items: T[] }[] = [];
  for (const item of sorted) {
    const month = new Date(item.date).toLocaleDateString(intlLocale(), { month: "long", year: "numeric", timeZone: "Asia/Bangkok" });
    const last = groups[groups.length - 1];
    if (last?.month === month) last.items.push(item);
    else groups.push({ month, items: [item] });
  }
  return groups;
}

export const historyService = {
  pointsReceived: (): PointTransaction[] => session.pointHistory.filter((p) => p.amount > 0),
  pointsUsed: (): PointTransaction[] => session.pointHistory.filter((p) => p.amount < 0),
  coinsReceived: (): PointTransaction[] => session.coinHistory.filter((p) => p.amount > 0),
  coinsUsed: (): PointTransaction[] => session.coinHistory.filter((p) => p.amount < 0),
  expiredPoints: (): PointTransaction[] => expiredPoints,

  /** ประวัติการแลก = redeemHistory ใน session + คูปองที่แลกจากหน้า exchange-point */
  redeemed: (): (RedeemRecord & { code?: string })[] => {
    const exchanged = exchangeState.records.map((r) => ({
      id: r.id,
      name: translate("core.discount_coupon_baht", { amount: r.discount }),
      points: r.points_used,
      date: r.created_at,
      status: "completed" as const,
      kind: "coupon" as const,
      code: r.code,
    }));
    return [...exchanged, ...session.redeemHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  /** คำนวณส่วนลดจากจำนวนคะแนน */
  discountFor: (points: number) => Math.floor(points / exchangeSettings.points_per_unit) * exchangeSettings.discount_per_unit,

  /** แลกคะแนนเป็นคูปองส่วนลด — ตัดคะแนนผ่าน sessionActions.updateCustomer */
  exchangePoints(points: number): ExchangeRecord | undefined {
    const discount = historyService.discountFor(points);
    if (points <= 0 || discount <= 0 || points > session.customer.points) return undefined;
    const record: ExchangeRecord = {
      id: `ex-${Date.now()}`,
      code: `PTC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      discount,
      points_used: points,
      created_at: new Date().toISOString(),
    };
    sessionActions.exchangePointsToCoupon(points, discount, record.code, exchangeSettings.coupon_validity_days);
    setExchangeState("records", (r) => [record, ...r]);
    persist();
    return record;
  },
};

/** คะแนนหมดอายุ 12 เดือนหลังวันที่ได้รับ (โหมด "คะแนนมีวันหมดอายุ" ในเมนู prototype) */
export const POINT_EXPIRE_MONTHS = 12;

/**
 * รายการคะแนนที่จะหมดอายุ (แท็บ "หมดอายุ" ในหน้าประวัติคะแนน — Figma Point History_Expire)
 * - คะแนนที่ได้รับแต่ละครั้งเป็น 1 ก้อน หมดอายุ 12 เดือนหลังวันที่ได้รับ
 * - คะแนนที่ใช้แลกไปแล้ว หักจากก้อนที่เก่าที่สุดก่อน (เข้าก่อนออกก่อน) — คำนวณจากยอดคงเหลือปัจจุบัน
 *   ผลรวมของแท็บนี้จึงเท่ากับ "คะแนนทั้งหมด" บนหัวหน้าเพจเสมอ
 * - ก้อนที่เหลือรวมตามวันหมดอายุ เรียงจากใกล้หมดอายุที่สุด
 * - ก้อนที่เลยวันหมดอายุแล้ว แสดงเป็น "หมดอายุแล้ว"
 */
export function expiringPoints(): PointTransaction[] {
  const lots = session.pointHistory
    .filter((p) => p.amount > 0)
    .map((p) => {
      const earned = new Date(p.date);
      const expires = new Date(earned);
      expires.setMonth(expires.getMonth() + POINT_EXPIRE_MONTHS);
      return { earned, expires, left: 0, amount: p.amount };
    })
    .sort((a, b) => b.earned.getTime() - a.earned.getTime());

  // เข้าก่อนออกก่อน = คะแนนคงเหลือมาจากก้อนที่ใหม่ที่สุด → กระจายยอดคงเหลือปัจจุบันจากก้อนใหม่ไปเก่า
  // ยอดที่เกินกว่าก้อนในประวัติ (ยอดยกมา) นับเป็นก้อนเดียวกับรายการที่เก่าที่สุด
  let balance = Math.max(0, session.customer.points);
  for (const lot of lots) {
    lot.left = Math.min(lot.amount, balance);
    balance -= lot.left;
  }
  if (balance > 0 && lots.length) lots[lots.length - 1].left += balance;

  const byDay = new Map<string, { expires: Date; earned: Date; points: number }>();
  for (const lot of lots.filter((l) => l.left > 0)) {
    const key = lot.expires.toISOString().slice(0, 10);
    const g = byDay.get(key);
    if (g) {
      g.points += lot.left;
      if (lot.earned > g.earned) g.earned = lot.earned;
    } else byDay.set(key, { expires: lot.expires, earned: lot.earned, points: lot.left });
  }

  const now = Date.now();
  return [...byDay.entries()]
    .sort((a, b) => a[1].expires.getTime() - b[1].expires.getTime())
    .map(([key, g]) => {
      const date = g.expires.toLocaleDateString(intlLocale(), { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" });
      const past = g.expires.getTime() < now;
      return {
        id: `exp-${key}`,
        title: translate(past ? "core.points_expired_on" : "core.points_will_expire", { points: g.points.toLocaleString("en-US"), date }),
        amount: g.points,
        date: g.earned.toISOString(),
        source: "expire",
      };
    });
}
