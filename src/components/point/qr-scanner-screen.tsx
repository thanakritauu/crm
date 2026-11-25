import { createEffect, createSignal, For, on, onCleanup, Show } from "solid-js";
import { Portal } from "solid-js/web";
import type QrScannerType from "qr-scanner";
import { Button } from "~/components/ui/button";
import { useI18n } from "~/lib/i18n";
import { cn } from "~/lib/utils";
import { earnService, QR_PREFIX } from "~/services/earn-service";
import { IconBack, IconFlash, IconImage } from "~/components/ui/icons";

/**
 * หน้าสแกนคิวอาร์โค้ดเต็มจอ (Figma "ScanQR" 589:5654)
 * - เปิดกล้องหลังจริงด้วยไลบรารี qr-scanner (ตัวเดียวกับเว็บเดิม) แล้วอ่าน QR อัตโนมัติ
 * - กรอบสแกน 260×260 มุม 24 + พื้นรอบกรอบดำโปร่ง 30%
 * - แถบล่างขาว (pt-24 pb-32 px-16): ปุ่มคลังรูป (อ่าน QR จากรูป) ซ้าย · ไฟฉาย ขวา (ใช้ได้เฉพาะเครื่องที่รองรับ เช่น Android)
 * - เปิดกล้องไม่ได้ (คอมไม่มีกล้อง / ไม่อนุญาต / ไม่ใช่ https) → แสดงปุ่มจำลองผลการสแกนแทน
 * ส่งผลกลับทาง onResult(ข้อความใน QR | null เมื่ออ่านไม่ได้)
 */
export function QrScannerScreen(props: { open: boolean; onClose: () => void; onResult: (data: string | null) => void }) {
  const { t } = useI18n();
  let video: HTMLVideoElement | undefined;
  let fileInput: HTMLInputElement | undefined;
  let scanner: QrScannerType | undefined;
  let lib: typeof QrScannerType | undefined;

  const [camera, setCamera] = createSignal<"starting" | "on" | "unavailable">("starting");
  const [flashSupported, setFlashSupported] = createSignal(false);
  const [flashOn, setFlashOn] = createSignal(false);

  const stop = () => {
    scanner?.stop();
    scanner?.destroy();
    scanner = undefined;
    setFlashOn(false);
  };

  const finish = (data: string | null) => {
    stop();
    props.onResult(data);
  };

  const start = async () => {
    setCamera("starting");
    try {
      lib ??= (await import("qr-scanner")).default;
      if (!video || !(await lib.hasCamera())) throw new Error("no camera");
      scanner = new lib(video, (r) => finish(r.data), {
        preferredCamera: "environment",
        returnDetailedScanResult: true,
        maxScansPerSecond: 5,
      });
      await scanner.start();
      setCamera("on");
      setFlashSupported(await scanner.hasFlash());
    } catch {
      stop();
      setCamera("unavailable");
    }
  };

  createEffect(on(() => props.open, (open) => (open ? queueMicrotask(start) : stop())));
  onCleanup(stop);

  const toggleFlash = async () => {
    if (!scanner || !flashSupported()) return;
    await scanner.toggleFlash();
    setFlashOn(scanner.isFlashOn());
  };

  const pickImage = async (file: File) => {
    try {
      lib ??= (await import("qr-scanner")).default;
      const r = await lib.scanImage(file, { returnDetailedScanResult: true, alsoTryWithoutScanRegion: true });
      finish(r.data);
    } catch {
      finish(null);
    }
  };

  /** ปุ่มจำลองเมื่อเปิดกล้องไม่ได้ */
  const demos = () => {
    const used = earnService.usedQrCodes();
    return [
      { label: t("core.qr_demo_new"), data: `${QR_PREFIX}${Math.random().toString(36).slice(2, 8).toUpperCase()}` },
      ...(used.length ? [{ label: t("core.qr_demo_used"), data: used[used.length - 1] }] : []),
      { label: t("core.qr_demo_unknown"), data: "https://example.com/menu" },
    ];
  };

  return (
    <Show when={props.open}>
      <Portal>
        <div class="fixed-frame top-0 z-fullscreen flex h-[100dvh] flex-col bg-black">
          {/* กล้อง + กรอบสแกน */}
          <div class="relative flex-1 overflow-hidden">
            <video ref={video} class="absolute inset-0 size-full object-cover" playsinline muted />
            <div class="absolute inset-0 flex items-center justify-center p-4">
              <div class="relative size-[260px] max-w-full rounded-3xl shadow-scan-mask">
                <Show when={camera() === "unavailable"}>
                  <div class="flex size-full flex-col items-center justify-center gap-4 rounded-3xl border border-white/30 p-4 text-center">
                    <p class="text-14 font-medium text-white">{t("core.camera_unavailable")}</p>
                    <p class="text-12 text-white/80">{t("core.camera_unavailable_hint")}</p>
                  </div>
                </Show>
              </div>
            </div>

            <button
              type="button"
              aria-label={t("common.back")}
              onClick={() => {
                stop();
                props.onClose();
              }}
              class="absolute left-4 top-4 flex size-8 items-center justify-center rounded-full bg-black/30"
            >
              <IconBack size={24} class="text-white" />
            </button>

            <Show when={camera() === "unavailable"}>
              <div class="absolute inset-x-4 bottom-4 flex flex-col gap-2">
                <For each={demos()}>
                  {(d, i) => (
                    <Button size="block" variant={i() === 0 ? "primary" : "white"} onClick={() => finish(d.data)}>
                      {d.label}
                    </Button>
                  )}
                </For>
              </div>
            </Show>
          </div>

          {/* แถบล่าง (Figma "action") */}
          <div class="flex items-start justify-between bg-white px-4 pb-8 pt-6">
            <button type="button" aria-label={t("core.pick_from_gallery")} onClick={() => fileInput?.click()} class="rounded-full bg-primary-surface p-2">
              <IconImage size={24} class="text-primary" />
            </button>
            <button
              type="button"
              aria-label={flashOn() ? t("core.flash_off") : t("core.flash_on")}
              aria-pressed={flashOn()}
              disabled={!flashSupported()}
              onClick={toggleFlash}
              class={cn("rounded-full p-2 transition", flashOn() ? "bg-primary" : "bg-primary-surface", !flashSupported() && "opacity-40")}
            >
              <IconFlash size={24} class={flashOn() ? "text-white" : "text-primary"} />
            </button>
          </div>

          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            class="hidden"
            onChange={(e) => {
              const f = e.currentTarget.files?.[0];
              e.currentTarget.value = "";
              if (f) pickImage(f);
            }}
          />
        </div>
      </Portal>
    </Show>
  );
}
