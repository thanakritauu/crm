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
export { outsideLine, pointsExpire, showTierCard, tierSystem };

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ pointsExpire: pointsExpire(), outsideLine: outsideLine(), tierSystem: tierSystem(), showTierCard: showTierCard() }));
  } catch {
    /* ignore */
  }
}

export function restorePrototypeSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    setPointsExpireSignal(!!s.pointsExpire);
    setOutsideLineSignal(!!s.outsideLine);
    setTierSystemSignal(s.tierSystem !== false);
    setShowTierCardSignal(s.showTierCard !== false);
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
