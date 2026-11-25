import { createSignal } from "solid-js";

/**
 * ตัวเลือกของ prototype (เก็บใน localStorage) — ไม่ใช่ส่วนของแอปจริง
 * pointsExpire: แสดงหน้าประวัติคะแนนแบบ "คะแนนมีวันหมดอายุ" (3 แท็บ) ตาม Figma Point History_Expire
 * outsideLine: จำลองเปิดแอปนอก LINE — หน้าเข้าสู่ระบบมีปุ่ม "เบอร์มือถือ" เพิ่ม (Figma Select_Register)
 */
const KEY = "charmiss-prototype-settings";
const [pointsExpire, setPointsExpireSignal] = createSignal(false);
const [outsideLine, setOutsideLineSignal] = createSignal(false);
export { outsideLine, pointsExpire };

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ pointsExpire: pointsExpire(), outsideLine: outsideLine() }));
  } catch {
    /* ignore */
  }
}

export function restorePrototypeSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    setPointsExpireSignal(!!s.pointsExpire);
    setOutsideLineSignal(!!s.outsideLine);
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
