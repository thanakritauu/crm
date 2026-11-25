import { session } from "~/lib/session";
import {
  platformConfigs,
  platformState,
  platformStoreActions,
  questionTypesByPlatform,
  type PlatformConfig,
  type PlatformKey,
} from "~/mocks/platforms";

/**
 * ต้นฉบับ: loyalty-mapping-service + customer-service (verify order / submit answers / bind)
 * Prototype จำลองผลตรวจสอบตามกติกานี้:
 *  - หมายเลขคำสั่งซื้อสั้นกว่า 6 ตัว → order_not_found
 *  - ขึ้นต้นด้วย "X" → ตอบคำถามครบแล้วได้ answer_incorrect (ไว้ดูเส้นทางผิดพลาด)
 *  - ขึ้นต้นด้วย "U" → ตอบคำถามครบแล้วได้ other_mapped (บัญชีแพลตฟอร์มนี้ถูกสมาชิกคนอื่นเชื่อมต่อแล้ว)
 *  - หมายเลขคำสั่งซื้อเดียวกับบัญชีที่เชื่อมอยู่แล้ว → self_mapped (บัญชีนี้เคยเชื่อมต่อกับ Charmiss แล้ว)
 *  - อื่น ๆ → ได้คำถาม 3 ข้อ ตอบข้อใดก็ผ่าน แล้วเชื่อมต่อสำเร็จ
 */
export type PlatformItem = PlatformConfig & { status: boolean; order_id?: string; platform_id?: string };

export type PlatformQuestion = {
  question_type: string;
  answers: { answer_choice: string; answer_value: string }[];
};

export type VerifyResult =
  | { result: true; ticket_id: string; questions: PlatformQuestion[]; skip_questions?: boolean }
  | { result: false; status: string };

export const normalizePlatform = (p: string | undefined): PlatformKey | undefined => {
  const v = String(p ?? "").trim().toLowerCase();
  const key = v === "line_myshop" || v === "line_my_shop" ? "line" : v;
  return platformConfigs.some((c) => c.platform === key) ? (key as PlatformKey) : undefined;
};

/** สุ่มแบบกำหนดผลได้จาก seed เพื่อให้คำถามไม่เปลี่ยนตอน re-render */
function seeded(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const baht = (n: number) => `฿${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function choicesFor(type: string, rnd: () => number): string[] {
  const pick = <T,>(fn: (i: number) => T) => [0, 1, 2, 3].map(fn);
  switch (type) {
    case "pay_time":
    case "create_time": {
      const day = 1 + Math.floor(rnd() * 25);
      return pick((i) => `${String(day + i).padStart(2, "0")}/11/2026 ${String(9 + i * 3).padStart(2, "0")}:${String(Math.floor(rnd() * 60)).padStart(2, "0")}`);
    }
    case "platform_username":
      return ["ploy.charmiss", "ploy_jaidee", "pinkploy98", "charm.ploy"];
    case "original_shipping_fee":
    case "final_shipping_fee":
      return [0, 30, 38, 45].map(baht);
    case "shipping_fee_discount":
    case "shipping_fee_discount_platform":
    case "product_discount":
    case "product_discount_platform":
      return [0, 15, 40, 100].map(baht);
    default: {
      const base = 250 + Math.floor(rnd() * 600);
      return pick((i) => baht(base + i * 57));
    }
  }
}

export const platformService = {
  list: (): PlatformItem[] =>
    [...platformConfigs]
      .sort((a, b) => a.priority - b.priority)
      .map((c) => {
        const b = platformState.bindings[c.platform];
        return { ...c, status: !!b, order_id: b?.order_id, platform_id: b?.platform_id };
      }),

  get: (platform: PlatformKey) => platformService.list().find((p) => p.platform === platform),

  /** ตรวจสอบคำสั่งซื้อ → คืนคำถามยืนยัน */
  verifyOrder(platform: PlatformKey, orderNumber: string): VerifyResult {
    const order = orderNumber.trim();
    const cfg = platformConfigs.find((c) => c.platform === platform);
    if (!cfg?.is_enabled) return { result: false, status: "platform_disabled" };
    if (order.length < 6) return { result: false, status: "order_not_found" };
    const other = Object.entries(platformState.bindings).find(([, b]) => b?.order_id === order);
    if (other) return { result: false, status: "self_mapped" };

    // V… = คำสั่งซื้อยืนยันแล้ว / ไม่ต้องตอบคำถาม → เชื่อมต่อทันที (เว็บจริง: already_verified_on_portal / skip_questions)
    if (/^v/i.test(order)) return { result: true, ticket_id: `tk-${Date.now()}`, questions: [], skip_questions: true };
    const rnd = seeded(`${platform}:${order}`);
    const pool = [...questionTypesByPlatform[platform]];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const questions = pool.slice(0, cfg.random_question_count).map((type) => ({
      question_type: type,
      answers: choicesFor(type, rnd).map((v, i) => ({ answer_choice: String(i + 1), answer_value: v })),
    }));
    return { result: true, ticket_id: `tk-${Date.now()}`, questions };
  },

  /** ส่งคำตอบ → ผูกบัญชี */
  submitAnswers(platform: PlatformKey, orderNumber: string): { result: boolean; status: string; platform_id?: string } {
    const order = orderNumber.trim();
    if (/^x/i.test(order)) return { result: false, status: "answer_incorrect" };
    if (/^u/i.test(order)) return { result: false, status: "other_mapped" };
    const cfg = platformConfigs.find((c) => c.platform === platform);
    const platform_id = cfg?.platform_id_source === "customer_phone" ? session.customer.phone : `buyer-${order.slice(-6)}`;
    platformStoreActions.bind(platform, { order_id: order, platform_id, bound_at: new Date().toISOString() });
    return { result: true, status: "success", platform_id };
  },

  unbind(platform: PlatformKey) {
    platformStoreActions.unbind(platform);
  },
};
