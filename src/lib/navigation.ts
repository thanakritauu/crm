import { useNavigate } from "@solidjs/router";
import { useTheme } from "~/lib/theme";

/**
 * ปุ่มย้อนกลับ (<) ทั้งแอป — **กลับหน้าก่อนหน้าเสมอ** (history.back)
 * - ถ้าหน้านี้เป็นหน้าแรกที่เปิดเข้ามา (เปิดจากลิงก์/LINE/รีเฟรช ไม่มีหน้าก่อนหน้าในแอป) → ไปหน้าแม่ (fallback) หรือหน้าแรก แบบ replace
 * - เลิกใช้ state.from / ปลายทางตายตัว: เดิมปุ่ม < บางหน้าพาไปหน้าที่กำหนดไว้ ไม่ใช่หน้าที่ผู้ใช้มา
 *   และการ navigate ไปหน้าเดิมแบบ push ทำให้ประวัติวนซ้ำ
 * path ที่ไม่ขึ้นต้นด้วย "/" จะต่อท้าย /:partner/ ให้
 */

/**
 * ลำดับหน้าในประวัติของแอป — ประทับ `__i` ลง history.state เอง (ไม่ใช้ `_depth` ของ @solidjs/router
 * เพราะหลังรีโหลด/เปิดซ้ำ URL เดิม `_depth` ไม่เพิ่มตามการ push จริง → ปุ่ม < คิดว่าไม่มีหน้าก่อนหน้า)
 * pushState = ลำดับ +1 · replaceState = ลำดับเดิม · popstate = อ่านจาก state ที่เก็บไว้
 * entryIndex = ลำดับของหน้าที่เปิดแอป (เปิดจากลิงก์/รีเฟรช) — ย้อนกลับได้เมื่อหน้าปัจจุบันอยู่หลังหน้านั้น
 */
let entryIndex: number | undefined;
const currentIndex = (): number => (typeof window.history.state?.__i === "number" ? window.history.state.__i : 0);
/** เรียกครั้งเดียวตอนแอปเริ่ม (ฝั่ง client) */
export function markEntryDepth() {
  if (entryIndex !== undefined) return;
  const h = window.history;
  if (typeof h.state?.__i !== "number") h.replaceState({ ...(h.state ?? {}), __i: 0 }, "");
  entryIndex = currentIndex();
  const push = h.pushState.bind(h);
  const replace = h.replaceState.bind(h);
  h.pushState = (state: unknown, unused: string, url?: string | URL | null) =>
    push({ ...((state as object) ?? {}), __i: currentIndex() + 1 }, unused, url);
  h.replaceState = (state: unknown, unused: string, url?: string | URL | null) =>
    replace({ ...((state as object) ?? {}), __i: currentIndex() }, unused, url);
}
/** มีหน้าก่อนหน้าภายในแอปหรือไม่ */
export const hasInAppHistory = () => typeof window !== "undefined" && entryIndex !== undefined && currentIndex() > entryIndex;

/** state ที่ส่งกลับไปให้หน้าก่อนหน้า (เช่น toast "บันทึกแล้ว") — หน้าปลายทางอ่านด้วย takeFlash() ตอน mount */
let flash: Record<string, unknown> | undefined;
export function takeFlash<T>(): T | undefined {
  const f = flash as T | undefined;
  flash = undefined;
  return f;
}

export function useGoBack() {
  const navigate = useNavigate();
  const { partner } = useTheme();
  const abs = (p: string) => (p.startsWith("/") ? p : `/${partner()}/${p}`);
  return (fallback?: string) => {
    if (hasInAppHistory()) return window.history.back();
    navigate(abs(fallback ?? "home"), { replace: true });
  };
}

/**
 * ย้อนกลับพร้อมผลลัพธ์ (บันทึกแล้วกลับ / เลือกที่อยู่แล้วกลับ) — ไม่ push หน้าเดิมซ้ำ:
 * history.back() แล้ว ถ้าหน้าที่กลับไปไม่ตรงกับ url (เช่นต้องเติม ?address=) → แทนที่ด้วย url
 * state ส่งผ่าน takeFlash() (และ location.state เมื่อเปิดหน้าตรง)
 */
export function useBackWith() {
  const navigate = useNavigate();
  const { partner } = useTheme();
  const abs = (p: string) => (p.startsWith("/") ? p : `/${partner()}/${p}`);
  return (url: string, state?: Record<string, unknown>) => {
    const target = abs(url);
    if (!hasInAppHistory()) return navigate(target, { replace: true, state });
    flash = state;
    window.addEventListener(
      "popstate",
      () => {
        // รอ router จัดการ popstate ก่อน แล้วค่อยแก้ URL ถ้าจำเป็น
        setTimeout(() => {
          if (`${location.pathname}${location.search}` !== target) navigate(target, { replace: true, state });
        }, 0);
      },
      { once: true },
    );
    window.history.back();
  };
}
