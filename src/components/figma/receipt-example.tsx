import { useI18n } from "~/lib/i18n";

/**
 * รูปตัวอย่างใบเสร็จ/คำสั่งซื้อ 4 ช่องทาง — อยู่ในรูปรวมไฟล์เดียวจาก Figma (public/images/figma/receipt-examples.png)
 * ตัดด้วยตำแหน่ง/ขนาดเดียวกับใน Figma (Info Receipt 677:14204, input_Receipt_* 589:6184)
 */
/** *-order = รูปที่ใช้ในหน้า "กรอกหมายเลขคำสั่งซื้อสินค้า" ของแต่ละแพลตฟอร์ม (Figma input_Receipt_Laz / _Tiktok) */
export type ReceiptChannel = "eveandboy" | "shopee" | "lazada" | "tiktok" | "lazada-order" | "tiktok-order";
type Crop = { height: number; flip: boolean; h: string; w: string; left: string; top: string };
const CROPS: Record<ReceiptChannel, Crop> = {
  eveandboy: { height: 338.114, flip: true, h: "295.95%", w: "-291.74%", left: "101%", top: "-182.37%" },
  shopee: { height: 339.13, flip: false, h: "292.15%", w: "288.86%", left: "0", top: "-77.53%" },
  lazada: { height: 548, flip: true, h: "181.48%", w: "-289.88%", left: "195.4%", top: "-48.16%" },
  tiktok: { height: 553.36, flip: true, h: "181.48%", w: "-292.78%", left: "292.42%", top: "-48.16%" },
  "lazada-order": { height: 339.13, flip: false, h: "296.15%", w: "292.81%", left: "-96.47%", top: "-141.64%" },
  "tiktok-order": { height: 339.13, flip: false, h: "296.15%", w: "292.81%", left: "-192.42%", top: "-141.64%" },
};

export function ReceiptExample(props: { channel: ReceiptChannel; class?: string }) {
  const { t } = useI18n();
  const c = () => CROPS[props.channel];
  const neg = () => c().w.startsWith("-");
  const width = () => (neg() ? c().w.slice(1) : c().w);
  return (
    <div
      role="img"
      aria-label={t("core.receipt_example_channel", { channel: props.channel })}
      class={`relative w-full overflow-hidden rounded-2xl ${props.class ?? ""}`}
      style={{ "aspect-ratio": `343 / ${c().height}`, transform: c().flip ? "scaleX(-1)" : undefined }}
    >
      <img
        src="/images/figma/receipt-examples.png"
        alt=""
        class="absolute max-w-none"
        style={{
          height: c().h,
          width: width(),
          left: neg() ? `calc(${c().left} - ${width()})` : c().left,
          top: c().top,
          transform: neg() ? "scaleX(-1)" : undefined,
        }}
      />
    </div>
  );
}
