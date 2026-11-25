import { children, Show, type JSX } from "solid-js";
import { useI18n } from "~/lib/i18n";
import { useGoBack } from "~/lib/navigation";
import { cn } from "~/lib/utils";
import { IconBack } from "~/components/ui/icons";

/**
 * PageHeader — หัวหน้าเพจตาม Figma
 * แถว: ปุ่มย้อนกลับ (chevron 24px) + ชื่อหน้า 18/Semi, padding 16, ช่องห่าง 8
 * - tone="white"   พื้นขาว ตัวอักษร Text/Black (เช่น กรอกเลขที่ใบเสร็จ, ตัวอย่างใบเสร็จ)
 * - tone="primary" พื้นชมพู มุมล่างโค้ง 24 ตัวอักษรขาว (เช่น ประวัติคะแนน, คูปองของฉัน, ข้อมูลส่วนตัว)
 * - align="center" ชื่อหน้าอยู่กลาง (ปุ่มย้อนกลับชิดซ้าย)
 * - children แสดงใต้แถวชื่อหน้า ห่าง 16 (เช่น ยอดคะแนน, PillTabs)
 */
export function PageHeader(props: {
  title?: JSX.Element;
  tone?: "white" | "primary";
  align?: "left" | "center";
  /** หน้าแม่ — ใช้เมื่อไม่มีหน้าก่อนหน้าในแอป (เปิดจากลิงก์ตรง) · ปกติปุ่ม < กลับหน้าก่อนหน้าเสมอ */
  backTo?: string;
  /** แทนพฤติกรรมย้อนกลับทั้งหมด */
  onBack?: () => void;
  hideBack?: boolean;
  right?: JSX.Element;
  children?: JSX.Element;
  class?: string;
}) {
  const { t } = useI18n();
  const goBack = useGoBack();
  // resolve JSX ครั้งเดียว (อ่าน props.title/right ซ้ำจะสร้าง DOM ซ้ำและทำให้ hydration ไม่ตรง)
  const title = children(() => props.title);
  const right = children(() => props.right);
  const primary = () => props.tone === "primary";
  const center = () => props.align === "center";
  return (
    <header class={cn("flex flex-col gap-4 p-4", primary() ? "rounded-b-3xl bg-primary text-white" : "bg-white text-dark", props.class)}>
      <Show when={title() !== undefined || !props.hideBack || right()}>
        <div class={cn("relative flex min-h-8 items-center gap-2", center() && "justify-center px-10")}>
          <Show when={!props.hideBack}>
            <button
              type="button"
              aria-label={t("common.back")}
              // วงกลมดำโปร่ง 32px + ลูกศรขาว — แบบเดียวกับหน้ารายละเอียด (NavigationTopbar บนรูป) ทุกหน้า
              class={cn("hit-area flex size-8 shrink-0 items-center justify-center rounded-full bg-black/20 transition active:scale-95", center() && "absolute left-0 top-1/2 -translate-y-1/2")}
              onClick={() => (props.onBack ? props.onBack() : goBack(props.backTo))}
            >
              <IconBack size={24} class="text-white" />
            </button>
          </Show>
          <h1 class={cn("min-w-0 whitespace-pre-line text-18 font-semibold", center() ? "text-center" : "flex-1")}>{title()}</h1>
          <Show when={right()}>
            <div class={cn("flex shrink-0 items-center", center() && "absolute right-0 top-1/2 -translate-y-1/2")}>{right()}</div>
          </Show>
        </div>
      </Show>
      {props.children}
    </header>
  );
}
