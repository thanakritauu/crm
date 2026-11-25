import { Show } from "solid-js";

/**
 * รูปตัวอย่างประกอบคำถามยืนยันบัญชีแพลตฟอร์ม (Figma "Shopee/Lazada/TikTok - Question" frames)
 * กล่องสูง 100px · Shopee มุม 16px, Lazada/TikTok มุม 8px
 * crop: "cover" = object-cover เต็มกล่อง, ตัวเลข = รูปสูง 121.08% เลื่อนขึ้นตาม top (%) เหมือนใน Figma
 * ประเภท *_platform ใช้รูปเดียวกับประเภทหลัก
 */
type Example = { src: string; crop: "cover" | number };
type PlatformKeyLite = "shopee" | "lazada" | "tiktok";

const EXAMPLES: Record<PlatformKeyLite, Record<string, Example>> = {
  shopee: {
    platform_username: { src: "/images/figma/example-username.png", crop: -0.54 },
    create_time: { src: "/images/figma/q-shopee-create_time.png", crop: -7.54 },
    pay_time: { src: "/images/figma/q-shopee-pay_time.png", crop: -7.54 },
    final_amount: { src: "/images/figma/q-shopee-final_amount.png", crop: -10.54 },
    original_sum_amount: { src: "/images/figma/q-shopee-original_sum_amount.png", crop: -0.61 },
    original_shipping_fee: { src: "/images/figma/q-shopee-original_shipping_fee.png", crop: -11.61 },
    final_shipping_fee: { src: "/images/figma/q-shopee-final_shipping_fee.png", crop: -11.61 },
  },
  lazada: {
    pay_time: { src: "/images/figma/q-lazada-pay_time.png", crop: "cover" },
    final_amount: { src: "/images/figma/q-lazada-final_amount.png", crop: "cover" },
    original_sum_amount: { src: "/images/figma/q-lazada-original_sum_amount.png", crop: "cover" },
    original_shipping_fee: { src: "/images/figma/q-lazada-original_shipping_fee.png", crop: -0.71 },
    final_shipping_fee: { src: "/images/figma/q-lazada-final_shipping_fee.png", crop: -0.9 },
    shipping_fee_discount: { src: "/images/figma/q-lazada-shipping_fee_discount.png", crop: -1.54 },
    product_discount: { src: "/images/figma/q-lazada-product_discount.png", crop: -1.54 },
  },
  tiktok: {
    create_time: { src: "/images/figma/q-tiktok-create_time.png", crop: "cover" },
    final_amount: { src: "/images/figma/q-tiktok-final_amount.png", crop: "cover" },
    original_sum_amount: { src: "/images/figma/q-tiktok-original_sum_amount.png", crop: "cover" },
    original_shipping_fee: { src: "/images/figma/q-tiktok-original_shipping_fee.png", crop: -0.03 },
    final_shipping_fee: { src: "/images/figma/q-tiktok-final_shipping_fee.png", crop: -0.54 },
    shipping_fee_discount: { src: "/images/figma/q-tiktok-shipping_fee_discount.png", crop: -0.54 },
    product_discount: { src: "/images/figma/q-tiktok-product_discount.png", crop: -0.54 },
  },
};

/** ชื่อฟิลด์ตามข้อความใน Figma (ค่า = key คำแปล) */
export const FIGMA_FIELD_LABEL: Record<string, string> = {
  platform_username: "core.field.platform_username",
  create_time: "core.field.create_time",
  pay_time: "core.field.pay_time",
  final_amount: "core.field.final_amount",
  original_sum_amount: "core.field.original_sum_amount",
  original_shipping_fee: "core.field.original_shipping_fee",
  final_shipping_fee: "core.field.final_shipping_fee",
  shipping_fee_discount: "core.field.shipping_fee_discount",
  shipping_fee_discount_platform: "core.field.shipping_fee_discount",
  product_discount: "core.field.product_discount",
  product_discount_platform: "core.field.product_discount",
};

export function getQuestionExample(platform: string | undefined, type: string): Example | undefined {
  if (platform !== "shopee" && platform !== "lazada" && platform !== "tiktok") return undefined;
  const p = platform as PlatformKeyLite;
  const base = type.replace(/_platform$/, "");
  return EXAMPLES[p][type] ?? EXAMPLES[p][base];
}

export function QuestionExample(props: { platform?: string; type: string; fallback?: import("solid-js").JSX.Element }) {
  const ex = () => getQuestionExample(props.platform, props.type);
  const radius = () => (props.platform === "lazada" || props.platform === "tiktok" ? "rounded-lg" : "rounded-2xl");
  return (
    <Show when={ex()} fallback={props.fallback}>
      {(e) => (
        <div class={`relative h-[100px] w-full overflow-hidden ${radius()}`}>
          <Show
            when={e().crop !== "cover"}
            fallback={<img src={e().src} alt="" class="absolute inset-0 h-full w-full object-cover" />}
          >
            <img src={e().src} alt="" class="absolute left-0 w-full max-w-none" style={{ height: "121.08%", top: `${e().crop}%` }} />
          </Show>
        </div>
      )}
    </Show>
  );
}
