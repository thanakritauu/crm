import { children, Show } from "solid-js";
import { useTheme } from "~/lib/theme";

/**
 * BrandHeader — แถบสี primary ด้านบน + โลโก้วงกลมซ้อนขอบล่าง
 * ใช้ในหน้า landing / user-verification — แถบสูง 120 มุมล่าง 24 + โลโก้วงกลม 96 ขอบขาว 4
 */
export function BrandHeader(props: { image?: string; right?: import("solid-js").JSX.Element }) {
  const { theme } = useTheme();
  // resolve JSX ครั้งเดียว (อ่าน props.right ซ้ำจะสร้าง DOM ซ้ำ → hydration ไม่ตรง)
  const right = children(() => props.right);
  return (
    <div class="relative flex h-[120px] w-full shrink-0 flex-col items-center justify-center rounded-b-3xl bg-primary">
      <Show when={right()}>
        <div class="absolute right-4 top-4">{right()}</div>
      </Show>
      <div class="relative z-raised mt-28 size-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-white shadow-card">
        <img src={props.image ?? theme().logo} alt={theme().client_name} class="h-full w-full object-cover" />
      </div>
    </div>
  );
}

/**
 * PageTitleHeader — แถบสีพร้อมชื่อหน้าตรงกลาง (หน้า mission / reward / coupon)
 * แถบสูง 136 มุมล่าง 24 ตัวอักษรขาว + หัวข้อ 24/Semi
 */
export function PageTitleHeader(props: { title: string; icon?: import("solid-js").JSX.Element }) {
  return (
    <div class="flex h-[136px] w-full shrink-0 items-center justify-center rounded-b-3xl bg-primary pt-6 text-white">
      <div class="flex flex-row items-center gap-x-2">
        <h2 class="text-24 font-semibold">{props.title}</h2>
        {props.icon}
      </div>
    </div>
  );
}
