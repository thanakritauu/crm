import { Checkbox as CheckboxPrimitive } from "@kobalte/core/checkbox";
import type { JSX } from "solid-js";
import { cn } from "~/lib/utils";

/** Checkbox (Kobalte) — กล่อง 20 มุม 8 ขอบ Stroke เข้ม → เลือกแล้ว bg-primary · label 14/Med ห่าง 8 */
export function Checkbox(props: {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  children?: JSX.Element;
  class?: string;
}) {
  return (
    <CheckboxPrimitive
      checked={props.checked}
      onChange={props.onChange}
      class={cn("flex items-start gap-2", props.class)}
    >
      <CheckboxPrimitive.Input class="peer" />
      <CheckboxPrimitive.Control class="mt-1 flex size-5 shrink-0 items-center justify-center rounded-lg border border-stroke-strong bg-white text-transparent transition data-[checked]:border-primary data-[checked]:bg-primary data-[checked]:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-primary-surface">
        <CheckboxPrimitive.Indicator forceMount>
          <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Control>
      <CheckboxPrimitive.Label class="text-14 text-dark">{props.children}</CheckboxPrimitive.Label>
    </CheckboxPrimitive>
  );
}
