import { createSignal } from "solid-js";

/**
 * ตัวเลือกของ prototype (เก็บใน localStorage) — ไม่ใช่ส่วนของแอปจริง
 * pointsExpire: แสดงหน้าประวัติคะแนนแบบ "คะแนนมีวันหมดอายุ" (3 แท็บ) ตาม Figma Point History_Expire
 * outsideLine: จำลองเปิดแอปนอก LINE — หน้าเข้าสู่ระบบมีปุ่ม "เบอร์มือถือ" เพิ่ม (Figma Select_Register)
 */
const KEY = "charmiss-prototype-settings";
const [pointsExpire, setPointsExpireSignal] = createSignal(false);
const [outsideLine, setOutsideLineSignal] = createSignal(false);
/** tierSystem: มีระบบระดับสมาชิก (ปิด = ไม่มีระดับเลย: ไม่มีการ์ดระดับหน้าแรก/เมนูในโปรไฟล์ · หน้าระดับแสดงว่ายังไม่มี) */
const [tierSystem, setTierSystemSignal] = createSignal(true);
/** showTierCard: แสดงการ์ด "ระดับของคุณ" ในหน้าแรก (ใช้เมื่อมีระบบระดับ) */
const [showTierCard, setShowTierCardSignal] = createSignal(true);
/** showWelcome: popup ต้อนรับขึ้นเองเมื่อเปิดหน้าแรก (ปิด = ไม่ขึ้น · สมาชิกใหม่หลังสมัครยังเห็น) */
const [showWelcome, setShowWelcomeSignal] = createSignal(true);
/** homeDark: หน้าแรกพื้นหลังชมพูเข้ม + การ์ดคะแนน|คอยน์สีขาว (ปิด = พื้นชมพูอ่อน + การ์ดชมพูเข้มแบบเดิม) — ทดลอง 2026-11-26 */
const [homeDark, setHomeDarkSignal] = createSignal(true);
/** homeBalance: การ์ดยอดหน้าแรกแสดง ทั้งคะแนนและคอยน์ (both) / คะแนนอย่างเดียว / คอยน์อย่างเดียว — 2026-11-26 */
export type HomeBalance = "both" | "points" | "coins";
const [homeBalance, setHomeBalanceSignal] = createSignal<HomeBalance>("both");
export { homeBalance, homeDark, outsideLine, pointsExpire, showTierCard, showWelcome, tierSystem };

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ pointsExpire: pointsExpire(), outsideLine: outsideLine(), tierSystem: tierSystem(), showTierCard: showTierCard(), showWelcome: showWelcome(), homeDark: homeDark(), homeBalance: homeBalance() }));
  } catch {
    /* ignore */
  }
}

export function restorePrototypeSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    setPointsExpireSignal(!!s.pointsExpire);
    setOutsideLineSignal(!!s.outsideLine);
    // สวิตช์ "มีระบบระดับสมาชิก" เอาออกจากเมนู prototype แล้ว (2026-11-26) → มีระบบระดับเสมอ (ไม่อ่านค่าเก่าที่อาจปิดไว้)
    setTierSystemSignal(true);
    setShowTierCardSignal(s.showTierCard !== false);
    setShowWelcomeSignal(s.showWelcome !== false);
    setHomeDarkSignal(s.homeDark !== false);
    setHomeBalanceSignal(s.homeBalance === "points" || s.homeBalance === "coins" ? s.homeBalance : "both");
  } catch {
    /* ignore */
  }
}

export function setPointsExpire(v: boolean) {
  setPointsExpireSignal(v);
  save();
}

export function setOutsideLine(v: boolean) {
  setOutsideLineSignal(v);
  save();
}

export function setTierSystem(v: boolean) {
  setTierSystemSignal(v);
  save();
}

export function setShowTierCard(v: boolean) {
  setShowTierCardSignal(v);
  save();
}

export function setShowWelcome(v: boolean) {
  setShowWelcomeSignal(v);
  save();
}

/** อ่านค่าจาก localStorage ตรงๆ — หน้าแรกเช็กตอน mount ซึ่งอาจมาก่อนเมนู prototype จะ restore */
export function welcomeEnabled() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}").showWelcome !== false;
  } catch {
    return true;
  }
}

export function setHomeDark(v: boolean) {
  setHomeDarkSignal(v);
  save();
}

export function setHomeBalance(v: HomeBalance) {
  setHomeBalanceSignal(v);
  save();
}
