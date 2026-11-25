import { Show } from "solid-js";

/**
 * Loading เต็มจอ (แทน FullScreenPageLoadingV2 ของต้นฉบับ: โลโก้ในวงหมุน + แสงฟุ้ง — ดูเก่า)
 * แบบใหม่: พื้นหลังมืดจางโปร่ง + การ์ดขาวกลางจอ มุม 16 เงา Card
 *   วงหมุน 32px (ราง Surface ชมพูอ่อน + เส้นชมพู 3px) · ข้อความ 14/Medium สีเทา (ถ้ามี)
 * ใช้ class ของ Tailwind ล้วน (animate-spin) — ไม่ต้องโหลดรูป จึงขึ้นทันที
 */
export function PageLoading(props: { show: boolean; message?: string }) {
  return (
    <Show when={props.show}>
      <div class="fixed inset-0 z-loading flex items-center justify-center bg-dark/20 px-8" role="status" aria-live="polite">
        <div class="flex min-w-[120px] max-w-[240px] flex-col items-center gap-4 rounded-2xl bg-white px-6 py-6 shadow-card">
          <span class="size-8 animate-spin rounded-full border-[3px] border-primary-surface border-t-primary" aria-hidden="true" />
          <Show when={props.message}>
            <p class="text-center text-14 font-medium text-gray">{props.message}</p>
          </Show>
        </div>
      </div>
    </Show>
  );
}
