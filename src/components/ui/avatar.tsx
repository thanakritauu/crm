import { createEffect, createSignal, Show } from "solid-js";
import { IconUser } from "~/components/ui/icons";
import { session } from "~/lib/session";
import { cn } from "~/lib/utils";

/**
 * รูปโปรไฟล์ผู้ใช้ — ใช้ร่วมกันทุกที่ (หน้าแรก, โปรไฟล์, ข้อมูลส่วนตัว, การ์ดสมาชิก) ให้เป็นรูปเดียวกันเสมอ
 * แหล่งรูป: session.customer.profile_image (ต้นฉบับ = รูปจาก LINE)
 * ไม่มีรูป / โหลดรูปไม่ได้ / Guest → วงกลมพื้นขาว + ไอคอนผู้ใช้สีเข้ม (ขนาดไอคอน = 50% ของวง)
 * size = เส้นผ่านศูนย์กลางเป็น px · ขอบขาว 2px ทุกที่
 */
export function Avatar(props: { size: number; class?: string; guest?: boolean }) {
  const [broken, setBroken] = createSignal(false);
  const src = () => (props.guest || !session.isMember ? "" : session.customer.profile_image);
  // เปลี่ยนรูป → ลองโหลดใหม่
  createEffect(() => {
    src();
    setBroken(false);
  });
  const style = () => ({ width: `${props.size}px`, height: `${props.size}px` });
  return (
    <Show
      when={src() && !broken()}
      fallback={
        <span class={cn("flex shrink-0 items-center justify-center rounded-full bg-white text-dark ring-2 ring-white", props.class)} style={style()} role="img" aria-label="">
          <IconUser size={Math.round(props.size / 2)} />
        </span>
      }
    >
      <img src={src()} alt="" width={props.size} height={props.size} class={cn("shrink-0 rounded-full bg-surface-gray object-cover ring-2 ring-white", props.class)} style={style()} onError={() => setBroken(true)} />
    </Show>
  );
}
