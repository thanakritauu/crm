import { createSignal, onCleanup, onMount, Show, type JSX } from "solid-js";
import { useI18n } from "~/lib/i18n";
import { useGoBack } from "~/lib/navigation";
import { cn } from "~/lib/utils";
import { IconBack } from "~/components/ui/icons";

/**
 * NavigationTopbar — พอร์ตจาก navigation-topbar.js ของต้นฉบับ
 * - ปุ่มย้อนกลับ chevron 24 (Figma) + ชื่อหน้า 18/Semi, padding 16 ช่องห่าง 8
 * - โปร่งใสวางทับ header จนเลื่อนเกิน hideAfterPx (150) แล้วเปลี่ยนเป็น sticky + blur
 * - ย้อนกลับ: หน้าก่อนหน้าเสมอ (history.back) · ไม่มีหน้าก่อนหน้าในแอป → navTo / หน้าแรก (lib/navigation)
 */
export function NavigationTopbar(props: {
  textMain?: JSX.Element;
  navTo?: string;
  hideBack?: boolean;
  /** ตัวอักษรสีขาว (ใช้เมื่อวางบนพื้นสี) */
  isLightColor?: boolean;
  rightElement?: JSX.Element;
  hideAfterPx?: number;
  /** กำหนดการย้อนกลับเอง (ใช้เฉพาะย้อนขั้นตอนภายในหน้า) */
  onBack?: () => void;
  /** วางทับรูปปก → ไล่เฉดดำโปร่งด้านบน ให้ลูกศรและชื่อหน้าสีขาวอ่านได้บนรูปทุกสี */
  overImage?: boolean;
}) {
  const { t } = useI18n();
  const [scrolled, setScrolled] = createSignal(false);

  onMount(() => {
    const onScroll = () => setScrolled((window.scrollY || 0) > (props.hideAfterPx ?? 150));
    window.addEventListener("scroll", onScroll, { passive: true });
    onCleanup(() => window.removeEventListener("scroll", onScroll));
  });

  const goBack = useGoBack();

  const light = () => props.isLightColor && !scrolled();

  return (
    <div
      class={cn(
        "left-0 top-0 w-full transition-colors duration-200",
        scrolled() ? "sticky z-header bg-white/50 shadow-card backdrop-blur-md" : "absolute z-header bg-transparent",
        props.overImage && !scrolled() && "bg-gradient-to-b from-black/40 to-transparent",
      )}
    >
      <div class="box-border grid w-full max-w-full grid-cols-[auto_minmax(0,_1fr)_auto] items-center gap-2 overflow-hidden p-4">
        <Show when={!props.hideBack} fallback={<div class="w-0" />}>
          {/* ปุ่มย้อนกลับ chevron 24px (Figma) · วางบนรูป/พื้นสีจะมีวงกลมโปร่งดำ 32px ให้อ่านง่าย */}
          <button
            type="button"
            onClick={() => (props.onBack ? props.onBack() : goBack(props.navTo))}
            aria-label={t("common.back")}
            class={cn("hit-area flex size-8 shrink-0 items-center justify-center rounded-full transition active:scale-95", light() && "bg-black/20")}
          >
            <IconBack size={24} class={light() ? "text-white" : "text-dark"} />
          </button>
        </Show>
        <div class="w-full min-w-0 overflow-hidden text-left">
          <span class={cn("block whitespace-pre-line break-words text-18 font-semibold", light() ? "text-white" : "text-dark")}>
            {props.textMain}
          </span>
        </div>
        <Show when={props.rightElement} fallback={<div class="w-0" />}>
          <div class="flex shrink-0 items-center">{props.rightElement}</div>
        </Show>
      </div>
    </div>
  );
}
