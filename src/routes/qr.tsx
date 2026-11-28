import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import { createResource, For, Show } from "solid-js";
import QRCode from "qrcode";
import { Card } from "~/components/ui/card";
import { QR_POINTS, QR_PREFIX } from "~/services/earn-service";

/**
 * /qr — QR ตัวอย่างสำหรับทดสอบหน้า "สแกนคิวอาร์โค้ด" (เครื่องมือของ prototype)
 * เปิดหน้านี้บนคอม แล้วใช้มือถือสแกน หรือบันทึกรูปไปเลือกจากคลังรูปในหน้าสแกน
 */
const SAMPLES: { code: string; note: string }[] = [
  { code: `${QR_PREFIX}A1B2C3`, note: `สแกนครั้งแรกได้ ${QR_POINTS} คะแนน · สแกนซ้ำ = ถูกใช้งานแล้ว` },
  { code: `${QR_PREFIX}D4E5F6`, note: `สแกนครั้งแรกได้ ${QR_POINTS} คะแนน · สแกนซ้ำ = ถูกใช้งานแล้ว` },
  { code: `${QR_PREFIX}G7H8J9`, note: `สแกนครั้งแรกได้ ${QR_POINTS} คะแนน · สแกนซ้ำ = ถูกใช้งานแล้ว` },
  { code: "https://example.com/menu", note: "ไม่ใช่ QR ของ Charmiss = ไม่พบคิวอาร์โค้ดนี้ในระบบ" },
];

export default function QrSamples() {
  const [images] = createResource(() => Promise.all(SAMPLES.map((s) => QRCode.toDataURL(s.code, { width: 480, margin: 2 }))));
  return (
    <main class="min-h-screen bg-surface-gray">
      <Title>QR ตัวอย่าง · Charmiss prototype</Title>
      <div class="mx-auto flex max-w-tool flex-col gap-6 px-4 py-8">
        <header class="flex flex-col gap-2">
          <A href="/prototype" class="text-14 font-semibold text-primary">
            ← กลับเมนู prototype
          </A>
          <h1 class="text-24 font-semibold text-dark">QR ตัวอย่างสำหรับทดสอบการสะสมคะแนน</h1>
          <p class="text-14 text-gray">
            เปิดหน้า สะสมคะแนน → สแกนคิวอาร์โค้ด บนมือถือ แล้วสแกน QR ด้านล่าง หรือบันทึกรูปแล้วกดปุ่มคลังรูปในหน้าสแกน · กล้องเปิดได้เฉพาะ https หรือ localhost ·
            รีเซ็ตรหัสที่ใช้แล้วได้จาก "รีเซ็ตข้อมูลจำลอง" ในเมนู prototype
          </p>
        </header>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <For each={SAMPLES}>
            {(s, i) => (
              <Card class="flex flex-col items-center gap-2 p-4 text-center">
                <Show when={images()?.[i()]} fallback={<div class="size-48 rounded-xl bg-surface-gray" />}>
                  {(src) => <img src={src()} alt={s.code} class="size-48" />}
                </Show>
                <code class="break-all font-mono text-12 font-medium text-dark">{s.code}</code>
                <p class="text-12 text-gray">{s.note}</p>
              </Card>
            )}
          </For>
        </div>
      </div>
    </main>
  );
}
