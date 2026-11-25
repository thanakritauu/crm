import { For, Show } from "solid-js";
import { Sheet } from "~/components/ui/sheet";
import { useI18n } from "~/lib/i18n";
import { cn } from "~/lib/utils";
import { IconCheck } from "~/components/ui/icons";

/**
 * bottom sheet "เรียงลำดับตาม" — ใช้ร่วมกัน (ภารกิจ / สิทธิพิเศษ)
 * แถวสูง 48px คั่นเส้น · ตัวที่เลือก = ตัวอักษรชมพู + เครื่องหมายถูก · กดแล้วปิด sheet
 */
export function SortSheet<T extends string>(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: T;
  options: { type: T; title: string }[];
  onChange: (value: T) => void;
}) {
  const { t } = useI18n();
  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange} title={t("common.sort_by")}>
      <div class="flex flex-col" role="radiogroup" aria-label={t("common.sort_by")}>
        <For each={props.options}>
          {(o) => (
            <button
              type="button"
              role="radio"
              aria-checked={props.value === o.type}
              onClick={() => {
                props.onChange(o.type);
                props.onOpenChange(false);
              }}
              class={cn(
                "flex min-h-12 items-center justify-between gap-2 border-b border-stroke text-left text-16 font-medium last:border-b-0",
                props.value === o.type ? "text-primary" : "text-dark",
              )}
            >
              {o.title}
              <Show when={props.value === o.type}>
                <IconCheck size={20} class="shrink-0" aria-hidden="true" />
              </Show>
            </button>
          )}
        </For>
      </div>
    </Sheet>
  );
}
