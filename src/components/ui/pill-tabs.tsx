import { For } from "solid-js";
import { cn } from "~/lib/utils";

/**
 * PillTabs — แท็บแคปซูลสีขาว (Figma "section title") ใช้ทุกที่ที่มีแท็บในแอป
 * กรอบขาว rounded-full + เงา Card · แต่ละแท็บสูง 40, 14/Medium
 * ตัวที่เลือก: Surface ม่วงอ่อน + ตัวชมพู · ตัวอื่น: Text/Disable
 */
export function PillTabs<T extends string | number>(props: {
  value: T;
  onChange: (v: T) => void;
  items: { value: T; label: string }[];
  class?: string;
}) {
  return (
    <div role="tablist" class={cn("flex w-full items-center rounded-full bg-white shadow-card", props.class)}>
      <For each={props.items}>
        {(it) => (
          <button
            type="button"
            role="tab"
            aria-selected={props.value === it.value}
            onClick={() => props.onChange(it.value)}
            class={cn(
              "flex h-10 min-w-0 flex-1 items-center justify-center truncate rounded-full px-2 text-14 font-medium transition-colors",
              props.value === it.value ? "bg-secondary-surface text-primary" : "text-gray-disable",
            )}
          >
            {it.label}
          </button>
        )}
      </For>
    </div>
  );
}
