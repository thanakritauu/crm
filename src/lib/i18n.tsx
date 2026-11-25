import { createContext, createEffect, useContext, type ParentComponent } from "solid-js";
import { session } from "~/lib/session";

/**
 * i18n แบบ key แบน (`common.confirm`, `mission.mission` ...) เหมือนต้นฉบับ · ตัวแปรในข้อความใช้ {{name}}
 *
 * ไฟล์คำแปล (โหลดอัตโนมัติทุกไฟล์ใน src/i18n):
 *   th.json / en.json             — dictionary หลัก (th ดึงจาก payload ของเว็บจริง)
 *   pages/<ส่วน>.th.json / .en.json — ข้อความที่ prototype เพิ่ม แยกไฟล์ตามส่วนของแอป
 * ภาษาที่ใช้ = session.language (เลือกจากเมนูภาษาในหน้าโปรไฟล์) · ไม่พบ key ในภาษาที่เลือก → ใช้ภาษาไทย → แสดง key
 */
export type Locale = "th" | "en";
export type Dictionary = Record<string, string>;
export type Translate = (key: string, params?: Record<string, string | number>) => string;

const files = import.meta.glob<Dictionary>("../i18n/**/*.json", { eager: true, import: "default" });
const dictionaries: Record<Locale, Dictionary> = { th: {}, en: {} };
for (const [path, dict] of Object.entries(files)) {
  const locale = path.split("/").pop()!.replace(/\.json$/, "").split(".").pop() as Locale;
  if (locale in dictionaries) Object.assign(dictionaries[locale], dict);
}

/** ภาษาปัจจุบัน (reactive) — ใช้ได้ทั้งใน component และนอก component */
export const currentLocale = (): Locale => (session.language === "en" ? "en" : "th");

/** แปลข้อความ — ใช้นอก component ได้ (เช่น service, utils) */
export const translate: Translate = (key, params) => {
  let text = dictionaries[currentLocale()][key] ?? dictionaries.th[key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) text = text.replaceAll(`{{${k}}}`, String(v));
  return text;
};

/** locale สำหรับ Intl (วันที่/เวลา): ไทยใช้ปี พ.ศ., อังกฤษใช้ en-GB (วัน เดือน ปี) */
export const intlLocale = () => (currentLocale() === "en" ? "en-GB" : "th-TH");

const I18nContext = createContext<{ t: Translate; locale: () => Locale }>();

export const I18nProvider: ParentComponent = (props) => {
  createEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = currentLocale();
  });
  return <I18nContext.Provider value={{ t: translate, locale: currentLocale }}>{props.children}</I18nContext.Provider>;
};

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
