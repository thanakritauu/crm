import { For } from "solid-js";
import { cn } from "~/lib/utils";
import { IconCheck } from "~/components/ui/icons";

/** ตารางแสตมป์ของภารกิจแบบ stamp — ดวงที่ได้แล้วเป็นสี primary พร้อมเครื่องหมายถูก */
export function StampGrid(props: { progress: number; target: number }) {
  const slots = () => Array.from({ length: props.target }, (_, i) => i < props.progress);
  return (
    <div class="grid grid-cols-5 gap-2 rounded-2xl bg-secondary-surface p-4">
      <For each={slots()}>
        {(filled, i) => (
          <div class="flex flex-col items-center gap-y-1">
            <div
              class={cn(
                "flex aspect-square w-full max-w-[52px] items-center justify-center rounded-full border-2 text-14 font-semibold",
                // ยังไม่ได้แสตมป์ = วงเทา (พื้นเทาอ่อน ขอบประเทา เลขเทา) — 2026-11-27 · ได้แล้ว = ชมพูทึบ + ✓
                filled ? "border-primary bg-primary text-white" : "border-dashed border-stroke-strong bg-surface-gray text-gray",
              )}
            >
              {filled ? (
                <IconCheck size={20} strokeWidth={2.5} />
              ) : (
                i() + 1
              )}
            </div>
          </div>
        )}
      </For>
    </div>
  );
}
