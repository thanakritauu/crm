import { session } from "~/lib/session";

/**
 * ระดับสมาชิก — ชื่อ เกณฑ์ และสิทธิประโยชน์ตรงกับเว็บ Charmiss ecom (charmiss-ecommerce/src/lib/membership.ts)
 *   Charmiss Glow → Charmiss Radiance → Charmiss Icon · นับยอดในปีปฏิทินนี้ · รับ 1 คะแนน ทุก ฿10
 * ecom คิดจากยอดซื้อ (฿0 / ฿3,000 / ฿10,000) → club คิดจาก **คะแนน** อย่างเดียว (ตัดสินใจ 2026-11-22)
 *   แปลงด้วยอัตราเดียวกัน 1 คะแนน = ฿10 → 0 / 300 / 1,000 คะแนน
 * นับคะแนนที่ "ได้รับ" ในปีนี้ ไม่หักคะแนนที่ใช้แลก → แลกของแล้วระดับไม่ตก · คอยน์ไม่นับ
 */
export type TierId = "glow" | "radiance" | "icon";
/** perks: key ใน tier.*.json · mark: รูปเหรียญของระดับ (ไฟล์เดียวกับ ecom) */
export type Tier = { id: TierId; min: number; minSpend: number; mark: string; perks: string[] };

export const TIERS: Tier[] = [
  { id: "glow", min: 0, minSpend: 0, mark: "/images/icons/tier-glow.png", perks: ["tier.perk_earn_rate", "tier.perk_birthday_50"] },
  { id: "radiance", min: 300, minSpend: 3000, mark: "/images/icons/tier-radiance.png", perks: ["tier.perk_x15", "tier.perk_birthday_100", "tier.perk_member_discount"] },
  { id: "icon", min: 1000, minSpend: 10000, mark: "/images/icons/tier-icon.png", perks: ["tier.perk_x2", "tier.perk_birthday_300", "tier.perk_early_access"] },
];

/** คะแนนที่ได้รับในปีปฏิทินนี้ (เหมือน ecom ที่นับยอดซื้อของปีนี้) */
export function earnedPointsThisYear(now = new Date()): number {
  const year = now.getFullYear();
  return session.pointHistory.filter((p) => p.amount > 0 && new Date(p.date).getFullYear() === year).reduce((s, p) => s + p.amount, 0);
}

export type TierStatus = {
  current: Tier;
  next?: Tier;
  earned: number;
  /** คะแนนที่ต้องได้เพิ่มเพื่อขึ้นระดับถัดไป (0 = ระดับสูงสุด) */
  needed: number;
  /** 0–1 ความคืบหน้าจากเกณฑ์ระดับปัจจุบันถึงระดับถัดไป */
  progress: number;
};

export function tierStatus(): TierStatus {
  const earned = earnedPointsThisYear();
  const idx = TIERS.reduce((acc, t, i) => (earned >= t.min ? i : acc), 0);
  const current = TIERS[idx];
  const next = TIERS[idx + 1];
  if (!next) return { current, earned, needed: 0, progress: 1 };
  return { current, next, earned, needed: next.min - earned, progress: (earned - current.min) / (next.min - current.min) };
}
