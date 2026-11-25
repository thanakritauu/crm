import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { useI18n } from "~/lib/i18n";
import { cn } from "~/lib/utils";

/**
 * แบนเนอร์หน้าแรกแบบสไลด์ (Figma หน้าแรก: แบนเนอร์ + จุดบอกตำแหน่ง 4 จุด)
 * - กรอบ 2:1 มุม 16 · รูปตัดกึ่งกลางแบบ object-cover
 * - ปัดซ้าย/ขวาได้ (scroll-snap) · เลื่อนเองทุก 4 วินาที · หยุดเลื่อนเองระหว่างผู้ใช้แตะ/ปัด แล้วเริ่มใหม่หลังปล่อย
 * - รูปเป็น "" = ช่องว่างพื้นเทาบอกขนาดรูป (1200 × 600 px · 2:1) สำหรับงานจริง
 * - จุด: อันที่แสดงอยู่ยาว 16px สีเทา · อันอื่น 8px ขาวโปร่ง (ตาม Figma) · แตะจุดเพื่อไปสไลด์นั้น
 */
export function BannerCarousel(props: { images: string[]; interval?: number }) {
  const { t } = useI18n();
  const [index, setIndex] = createSignal(0);
  let track: HTMLDivElement | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;

  const goTo = (i: number) => {
    if (!track) return;
    const n = props.images.length;
    const next = ((i % n) + n) % n;
    track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
  };
  const start = () => {
    stop();
    timer = setInterval(() => goTo(index() + 1), props.interval ?? 4000);
  };
  const stop = () => timer && clearInterval(timer);

  onMount(() => {
    start();
    onCleanup(stop);
  });

  return (
    <div class="relative aspect-banner overflow-hidden rounded-2xl" role="region" aria-roledescription="carousel" aria-label={t("core.banner_label")}>
      <div
        ref={track}
        class="hide-scrollbar flex size-full snap-x snap-mandatory overflow-x-auto"
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        onPointerDown={stop}
        onTouchStart={stop}
        onPointerUp={start}
        onTouchEnd={start}
      >
        <For each={props.images}>
          {(src, i) => (
            // src ว่าง ("") = ช่องสำหรับรูปจริง: พื้นเทา + บอกขนาดรูปที่ต้องใช้
            <Show
              when={src}
              fallback={
                <div
                  class="flex size-full shrink-0 snap-center flex-col items-center justify-center gap-1 bg-surface-gray text-center text-gray"
                  aria-label={t("core.banner_slide", { n: i() + 1, total: props.images.length })}
                >
                  <span class="text-14 font-medium">{t("core.banner_placeholder")}</span>
                  <span class="text-12">{t("core.banner_size")}</span>
                </div>
              }
            >
              <img
                src={src}
                alt=""
                aria-label={t("core.banner_slide", { n: i() + 1, total: props.images.length })}
                class="size-full shrink-0 snap-center object-cover"
                draggable={false}
              />
            </Show>
          )}
        </For>
      </div>
      <div class="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1">
        <For each={props.images}>
          {(_, i) => (
            <button
              type="button"
              aria-label={t("core.banner_slide", { n: i() + 1, total: props.images.length })}
              aria-current={index() === i()}
              onClick={() => {
                goTo(i());
                start();
              }}
              class="hit-area flex h-2 items-center"
            >
              <span class={cn("block h-1 rounded-full transition-all", index() === i() ? "w-4 bg-gray" : "w-2 bg-white/60")} />
            </button>
          )}
        </For>
      </div>
    </div>
  );
}
