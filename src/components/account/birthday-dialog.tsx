import { createEffect, createMemo, createSignal, For, Match, Switch } from "solid-js";
import { Button } from "~/components/ui/button";
import { Dialog } from "~/components/ui/dialog";
import { currentLocale, useI18n, type Locale } from "~/lib/i18n";
import { cn } from "~/lib/utils";

/**
 * เลือกวันเกิด — Dialog หัวข้อ 18/Semi · หัว เดือน/ปี (พ.ศ.) กดเพื่อสลับไปหน้าเลือกปี grid-cols-3
 * / เลือกเดือน grid-cols-2 (ปุ่ม Button 40) · ปฏิทินบนพื้น Surface/Gray มุม 16 วันละวงกลม 32
 * Prototype: ปฏิทินเขียนเองแบบง่าย (ไม่มี flatpickr) · ห้ามเลือกวันในอนาคต
 */
export const THAI_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const EN_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS: Record<Locale, string[]> = { th: THAI_MONTHS, en: EN_MONTHS };
const WEEKDAYS: Record<Locale, string[]> = {
  th: ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"],
  en: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
};
/** ปีที่แสดง: ไทยใช้ พ.ศ. · อังกฤษใช้ ค.ศ. */
const displayYear = (y: number, locale: Locale) => (locale === "th" ? y + 543 : y);

/** "1998-03-14" → "14 มีนาคม 2541" (th) / "14 March 1998" (en) */
export function formatThaiBirthday(value?: string) {
  if (!value) return "";
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return "";
  const locale = currentLocale();
  return `${d} ${MONTHS[locale][m - 1]} ${displayYear(y, locale)}`;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function BirthdayDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: string;
  onSelect: (value: string) => void;
  title?: string;
}) {
  const { t, locale } = useI18n();
  const today = new Date();
  const [view, setView] = createSignal<"day" | "month" | "year">("day");
  const [year, setYear] = createSignal(today.getFullYear() - 20);
  const [month, setMonth] = createSignal(0);

  // เปิดใหม่ทุกครั้ง → กลับไปเดือน/ปีของค่าที่เลือกไว้
  createEffect(() => {
    if (!props.open) return;
    setView("day");
    if (props.value) {
      const [y, m] = props.value.split("-").map(Number);
      setYear(y);
      setMonth(m - 1);
    }
  });

  const years = Array.from({ length: 90 }, (_, i) => today.getFullYear() - i);
  const days = createMemo(() => {
    const first = new Date(year(), month(), 1).getDay();
    const count = new Date(year(), month() + 1, 0).getDate();
    return [...Array<null>(first).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  });
  const isFuture = (d: number) => new Date(year(), month(), d) > today;
  const isSelected = (d: number) => props.value === `${year()}-${pad(month() + 1)}-${pad(d)}`;

  const shiftMonth = (delta: number) => {
    const m = month() + delta;
    setYear(year() + Math.floor(m / 12));
    setMonth(((m % 12) + 12) % 12);
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange} title={props.title ?? t("profile.form.date_of_birth.placeholder")}>
      <Switch>
        <Match when={view() === "year"}>
          <div class="max-h-80 overflow-y-auto rounded-2xl bg-surface-gray p-2">
            <div class="grid grid-cols-3 gap-2">
              <For each={years}>
                {(y) => (
                  <Button variant={y === year() ? "primary" : "white"} class={cn(y !== year() && "text-dark")} onClick={() => { setYear(y); setView("month"); }}>
                    {displayYear(y, locale())}
                  </Button>
                )}
              </For>
            </div>
          </div>
        </Match>
        <Match when={view() === "month"}>
          <div class="rounded-2xl bg-surface-gray p-2">
            <div class="grid grid-cols-2 gap-2">
              <For each={MONTHS[locale()]}>
                {(m, i) => (
                  <Button variant={i() === month() ? "primary" : "white"} class={cn(i() !== month() && "text-dark")} onClick={() => { setMonth(i()); setView("day"); }}>
                    {m}
                  </Button>
                )}
              </For>
            </div>
          </div>
        </Match>
        <Match when={view() === "day"}>
          <div class="flex flex-col gap-2">
            <div class="flex flex-col gap-2 rounded-2xl bg-surface-gray p-2">
              <div class="flex w-full items-center justify-between">
                <Button variant="white" size="icon" class="text-18 text-dark" onClick={() => shiftMonth(-1)} aria-label={t("account.previous_month")}>‹</Button>
                <div class="flex flex-col items-center gap-1">
                  <Button variant="white" size="sm" class="text-16 font-semibold text-dark" onClick={() => setView("month")}>
                    {MONTHS[locale()][month()]}
                  </Button>
                  <Button variant="white" size="sm" class="text-gray" onClick={() => setView("year")}>
                    {displayYear(year(), locale())}
                  </Button>
                </div>
                <Button variant="white" size="icon" class="text-18 text-dark" onClick={() => shiftMonth(1)} aria-label={t("account.next_month")}>›</Button>
              </div>
              <div class="grid grid-cols-7 gap-y-1 text-center">
                <For each={WEEKDAYS[locale()]}>{(w) => <span class="py-1 text-12 font-semibold text-gray">{w}</span>}</For>
                <For each={days()}>
                  {(d) =>
                    d === null ? (
                      <span />
                    ) : (
                      <button
                        type="button"
                        disabled={isFuture(d)}
                        onClick={() => {
                          props.onSelect(`${year()}-${pad(month() + 1)}-${pad(d)}`);
                          props.onOpenChange(false);
                        }}
                        class={cn(
                          "mx-auto flex size-8 items-center justify-center rounded-full text-14 text-dark hover:bg-primary-surface disabled:text-gray-placeholder disabled:hover:bg-transparent",
                          isSelected(d) && "bg-primary font-semibold text-white hover:bg-primary",
                        )}
                      >
                        {d}
                      </button>
                    )
                  }
                </For>
              </div>
            </div>
            <p class="text-center text-12 text-gray">{t("account.birthday_quick_change_hint")}</p>
          </div>
        </Match>
      </Switch>
    </Dialog>
  );
}
