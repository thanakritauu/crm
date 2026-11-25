import { createStore } from "solid-js/store";

/**
 * แพลตฟอร์มออนไลน์ที่เชื่อมต่อได้ — ค่าเริ่มต้นตาม DEFAULT_PLATFORMS ในต้นฉบับ (index-2a673c41.js)
 * ต้นฉบับดึงจาก loyalty-mapping-service (/api/.../platforms + bind status) — prototype เก็บสถานะใน store นี้
 */
export type PlatformKey = "shopee" | "lazada" | "tiktok" | "line";

export type PlatformConfig = {
  platform: PlatformKey;
  display_name: string;
  priority: number;
  is_enabled: boolean;
  /** โหมดคำถามยืนยันตัวตน (ต้นฉบับ: random 3 ข้อ) */
  random_question_count: number;
  /** LINE Shopping ใช้เบอร์โทรเป็น platform id */
  platform_id_source: "portal_buyer_id" | "customer_phone";
  /** สีพื้นไอคอน (ต้นฉบับวาด SVG โลโก้บนพื้นสีนี้) */
  icon_class: string;
  icon_label: string;
};

export const platformConfigs: PlatformConfig[] = [
  { platform: "shopee", display_name: "Shopee", priority: 1, is_enabled: true, random_question_count: 3, platform_id_source: "portal_buyer_id", icon_class: "bg-gradient-to-br from-platform-shopee-light to-platform-shopee", icon_label: "S" },
  { platform: "lazada", display_name: "Lazada", priority: 2, is_enabled: true, random_question_count: 3, platform_id_source: "portal_buyer_id", icon_class: "bg-platform-lazada", icon_label: "Laz" },
  { platform: "tiktok", display_name: "TikTok", priority: 3, is_enabled: true, random_question_count: 3, platform_id_source: "portal_buyer_id", icon_class: "bg-platform-tiktok-dark", icon_label: "TT" },
  { platform: "line", display_name: "LINE Shopping", priority: 0, is_enabled: true, random_question_count: 3, platform_id_source: "customer_phone", icon_class: "bg-platform-line", icon_label: "LINE" },
];

/** ชนิดคำถามที่สุ่มได้ต่อแพลตฟอร์ม (คัดลอกจากต้นฉบับ _platform_-f97d41a1.js) */
export const questionTypesByPlatform: Record<PlatformKey, string[]> = {
  tiktok: ["final_amount", "original_sum_amount", "create_time", "original_shipping_fee", "final_shipping_fee", "shipping_fee_discount", "product_discount", "shipping_fee_discount_platform", "product_discount_platform"],
  lazada: ["final_amount", "original_sum_amount", "pay_time", "original_shipping_fee", "final_shipping_fee", "shipping_fee_discount", "product_discount", "shipping_fee_discount_platform", "product_discount_platform"],
  shopee: ["final_amount", "original_sum_amount", "pay_time", "create_time", "original_shipping_fee", "final_shipping_fee", "platform_username"],
  line: ["final_amount", "original_sum_amount", "final_shipping_fee", "product_discount"],
};

export type PlatformBinding = { order_id: string; platform_id: string; bound_at: string };

type PlatformState = { bindings: Partial<Record<PlatformKey, PlatformBinding>> };

const STORAGE_KEY = "charmiss-prototype-platforms-v1";

/** เริ่มต้น: เชื่อมต่อ Shopee ไว้แล้ว 1 ช่องทาง เพื่อให้เห็นทั้งสองสถานะ */
const initialState = (): PlatformState => ({
  // หน้าจริง (บัญชีที่ตรวจ) ยังไม่ได้เชื่อมต่อช่องทางใด: "เชื่อมต่อแล้ว 0/4"
  bindings: {},
});

const [platformState, setPlatformState] = createStore<PlatformState>(initialState());
export { platformState };

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(platformState));
  } catch {
    /* ignore */
  }
}

/** เรียกหลัง mount ฝั่ง client */
export function restorePlatformState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setPlatformState({ ...initialState(), ...JSON.parse(raw) });
  } catch {
    /* ignore */
  }
}

export const platformStoreActions = {
  bind(platform: PlatformKey, binding: PlatformBinding) {
    setPlatformState("bindings", platform, binding);
    persist();
  },
  unbind(platform: PlatformKey) {
    setPlatformState("bindings", platform, undefined);
    persist();
  },
  reset() {
    setPlatformState(initialState());
    persist();
  },
};
