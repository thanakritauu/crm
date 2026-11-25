import { For, Show } from "solid-js";
import { CoverImage } from "~/components/ui/cover-image";
import type { RewardCategory } from "~/mocks/rewards";
import { useI18n } from "~/lib/i18n";
import { IconClose } from "~/components/ui/icons";

/**
 * TagSelection ของต้นฉบับ (tag-selection-*.js)
 * แถวเลื่อนแนวนอน: ไอคอนกลม 32px + ป้าย 12
 * รายการที่เลือกถูกย้ายไปไว้หน้าสุดพร้อมปุ่ม X สีแดง (กด X = ยกเลิกการเลือก)
 * ต้นฉบับใช้รูปจาก API (ตอนนี้เป็น placeholder) — prototype วาดวงกลมไล่สีแทน
 */
export function CategorySelection(props: {
  items: RewardCategory[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useI18n();
  const selected = () => props.items.find((c) => c.value === props.value && c.value !== "all");
  const rest = () => props.items.filter((c) => c.value !== "all" && c.value !== props.value);

  return (
    <div class="hide-scrollbar flex overflow-x-auto">
      <div class="flex space-x-4">
        <Show when={selected()}>
          {(c) => (
            <div class="relative flex cursor-pointer flex-col items-center">
              <div class="mx-4 size-8 overflow-hidden rounded-full bg-surface-gray ring-2 ring-primary">
                <CoverImage colors={c().cover} class="size-8" />
              </div>
              <span class="mt-1 text-12 font-medium text-primary">{c().label}</span>
              <button
                type="button"
                aria-label={t("loyalty.deselect_category", { name: c().label })}
                onClick={(e) => {
                  e.stopPropagation();
                  props.onChange("all");
                }}
                class="hit-area absolute right-0 top-0 mr-2 flex size-4 items-center justify-center rounded-full bg-error text-white"
              >
                <IconClose size={12} strokeWidth={2.5} aria-hidden="true" />
              </button>
            </div>
          )}
        </Show>
        <For each={rest()}>
          {(c) => (
            <button type="button" class="flex cursor-pointer flex-col items-center" onClick={() => props.onChange(c.value)}>
              <div class="mx-4 size-8 overflow-hidden rounded-full bg-surface-gray">
                <CoverImage colors={c.cover} class="size-8" />
              </div>
              <span class="mt-1 text-12 text-dark">{c.label}</span>
            </button>
          )}
        </For>
      </div>
    </div>
  );
}
