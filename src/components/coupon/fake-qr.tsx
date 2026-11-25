import { For } from "solid-js";
import { useI18n } from "~/lib/i18n";

/** สร้างตัวเลขสุ่มแบบคงที่จากข้อความ (ให้ QR/บาร์โค้ดจำลองหน้าตาเหมือนเดิมทุกครั้งสำหรับโค้ดเดียวกัน) */
function seeded(text: string) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 1000) / 1000;
  };
}

const SIZE = 25;
const inFinder = (x: number, y: number) => {
  const corners = [
    [0, 0],
    [SIZE - 7, 0],
    [0, SIZE - 7],
  ];
  return corners.some(([cx, cy]) => x >= cx - 1 && x <= cx + 7 && y >= cy - 1 && y <= cy + 7);
};

/**
 * QR จำลอง (ไม่ใช่ QR จริง สแกนไม่ได้) — ต้นฉบับวาดลง <canvas> ด้วยไลบรารี QR
 * แสดงป้าย "QR จำลอง" กำกับไว้เสมอ
 */
export function FakeQr(props: { value: string; class?: string }) {
  const { t } = useI18n();
  const cells = () => {
    const rnd = seeded(props.value);
    const out: [number, number][] = [];
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (!inFinder(x, y) && rnd() > 0.52) out.push([x, y]);
    return out;
  };
  const finder = (x: number, y: number) => (
    <g>
      <rect x={x} y={y} width="7" height="7" fill="#000" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill="#000" />
    </g>
  );
  return (
    <div class={props.class}>
      <svg viewBox={`-2 -2 ${SIZE + 4} ${SIZE + 4}`} class="w-full bg-white shadow-card" shape-rendering="crispEdges" role="img" aria-label={t("loyalty.fake_qr_label")}>
        <For each={cells()}>{([x, y]) => <rect x={x} y={y} width="1" height="1" fill="#000" />}</For>
        {finder(0, 0)}
        {finder(SIZE - 7, 0)}
        {finder(0, SIZE - 7)}
      </svg>
    </div>
  );
}

/** บาร์โค้ดจำลอง (สแกนไม่ได้) */
export function FakeBarcode(props: { value: string; class?: string }) {
  const { t } = useI18n();
  const bars = () => {
    const rnd = seeded(props.value + "#bar");
    const out: { x: number; w: number }[] = [];
    let x = 0;
    while (x < 190) {
      const w = 1 + Math.floor(rnd() * 3);
      if (rnd() > 0.4) out.push({ x, w });
      x += w + 1 + Math.floor(rnd() * 2);
    }
    return out;
  };
  return (
    <div class={props.class}>
      <svg viewBox="-5 0 200 80" class="w-full bg-white shadow-card" shape-rendering="crispEdges" role="img" aria-label={t("loyalty.fake_barcode_label")}>
        <For each={bars()}>{(b) => <rect x={b.x} y={6} width={b.w} height={68} fill="#000" />}</For>
      </svg>
      <p class="mt-1 text-center text-12 text-gray">{props.value}</p>
    </div>
  );
}
