import { For } from "solid-js";
import { Sheet } from "~/components/ui/sheet";
import { useI18n } from "~/lib/i18n";
import { session, sessionActions } from "~/lib/session";
import { cn } from "~/lib/utils";

/** ชื่อภาษาแสดงเป็นภาษานั้น ๆ เสมอ (ไม่แปล) */
/** เลือกภาษา (Figma "Change language" 1618:6462) — Sheet พร้อมหัวข้อ/ปุ่มปิด, ธงวงกลม 16px, ภาษาที่เลือกเป็นสีชมพู */
export const LANGUAGES = [
  { value: "th" as const, label: "ภาษาไทย", flag: "/images/figma/flag-th.png" },
  { value: "en" as const, label: "English", flag: "/images/figma/flag-en.png" },
];

/** รายการภาษา (ใช้ร่วมกันใน Sheet และหน้าการตั้งค่า) — onPicked เรียกหลังเปลี่ยนภาษา */
export function LanguageList(props: { onPicked?: () => void }) {
  return (
    <div class="flex flex-col gap-2" role="radiogroup">
      <For each={LANGUAGES}>
        {(l) => (
          <button
            type="button"
            role="radio"
            aria-checked={session.language === l.value}
            class="flex min-h-10 items-center gap-4 text-left"
            onClick={() => {
              sessionActions.setLanguage(l.value);
              props.onPicked?.();
            }}
          >
            <img src={l.flag} alt="" width="16" height="16" class="h-4 w-4 rounded-full" />
            <span class={cn("text-16 font-medium", session.language === l.value ? "text-primary" : "text-gray")}>{l.label}</span>
          </button>
        )}
      </For>
    </div>
  );
}

export function LanguageSheet(props: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useI18n();
  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange} title={t("common.choose_language")} class="pb-[136px]">
      <div class="pt-2">
        <LanguageList onPicked={() => props.onOpenChange(false)} />
      </div>
    </Sheet>
  );
}
