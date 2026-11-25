import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import { intlLocale, translate } from "~/lib/i18n";

/** tailwind-merge ที่รู้จัก token ของ design system (ต้องตรงกับ tailwind.config.cjs) */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["24", "18", "16", "14", "12"] }],
      shadow: [{ shadow: ["card"] }],
      "drop-shadow": [{ "drop-shadow": ["card"] }],
      z: [{ z: ["raised", "card", "header", "fab", "bar", "modal", "toast", "devtools", "fullscreen", "loading"] }],
      w: [{ w: ["modal"] }],
      "max-w": [{ "max-w": ["mobile", "tool", "docs"] }],
      h: [{ h: ["hero"] }],
      aspect: [{ aspect: ["cover"] }],
    },
  },
});

/** รวม class แบบ solid-ui (เหมือน `cn` ในต้นฉบับ: clsx + tailwind-merge) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** จัดรูปแบบตัวเลข เช่น 1250 → "1,250" (ต้นฉบับใช้ helper ใน common.js) */
export function formatNumber(value: number | undefined | null, maxFractionDigits = 0) {
  return (value ?? 0).toLocaleString("en-US", { maximumFractionDigits: maxFractionDigits });
}

/** หน่วงเวลาเพื่อจำลองการเรียก API */
export const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

/** วันที่ตามภาษาที่เลือก เช่น "31 ธ.ค. 2569" / "31 Dec 2026" (ต้นฉบับใช้ moment-timezone) */
export function formatDate(value: string | Date, withTime = false) {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString(intlLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Asia/Bangkok",
  });
}

/** ข้อความรายการประวัติคะแนน/คอยน์ ตามภาษาปัจจุบัน (รายการใหม่เก็บ key + params, ข้อมูลตัวอย่างเดิมใช้ title/source) */
export function txText(item: { title: string; source: string; key?: string; params?: Record<string, string | number>; source_key?: string }) {
  return {
    title: item.key ? translate(item.key, item.params) : item.title,
    source: item.source_key ? translate(item.source_key) : item.source,
  };
}

/** จำนวนวันที่เหลือก่อนวันที่ที่กำหนด */
export function daysLeft(value: string) {
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000);
}
