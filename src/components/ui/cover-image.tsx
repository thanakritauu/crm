import { Show } from "solid-js";
import { cn } from "~/lib/utils";

/**
 * ภาพปก — ถ้ามี `src` แสดงรูปจริง (object-cover) ไม่งั้นแสดงภาพไล่สี + ชื่อ
 * รูปตัวอย่างอยู่ใน public/images/missions (ดาวน์โหลดจากภารกิจจริงของ Charmiss Club)
 * ต้นฉบับใช้ SkeltonImageCanUseBase64 (รูปจาก backend)
 */
export function CoverImage(props: {
  colors: [string, string];
  src?: string;
  label?: string;
  class?: string;
  textClass?: string;
  /** การวางรูป (ค่าเริ่มต้น cover) */
  fit?: "cover" | "contain";
}) {
  return (
    <div
      class={cn("relative flex items-center justify-center overflow-hidden", props.class)}
      style={props.src ? undefined : { background: `linear-gradient(135deg, ${props.colors[0]}, ${props.colors[1]})` }}
    >
      <Show
        when={props.src}
        fallback={
          <>
            <div class="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/20" />
            <div class="absolute -bottom-8 -left-4 h-24 w-24 rounded-full bg-white/10" />
            {props.label && (
              <span class={cn("relative px-4 text-center text-14 font-semibold text-white drop-shadow-card", props.textClass)}>
                {props.label}
              </span>
            )}
          </>
        }
      >
        <img src={props.src} alt={props.label ?? ""} loading="lazy" class={cn("absolute inset-0 h-full w-full", props.fit === "contain" ? "bg-white object-contain" : "bg-primary-surface object-cover")} />
      </Show>
    </div>
  );
}
