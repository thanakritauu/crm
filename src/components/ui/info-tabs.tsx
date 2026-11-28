import { createSignal, For, Show } from "solid-js";
import { PillTabs } from "./pill-tabs";

export type InfoTab = { value: string; label: string; heading?: string; content?: string[] | string };

/**
 * InfoTabs — แท็บข้อมูลของหน้า detail (ขั้นตอน / เงื่อนไข / การใช้คูปอง ฯลฯ)
 * แถบแท็บใช้ PillTabs · เนื้อหา: หัวข้อ 14/Semi + รายการลำดับเลข 12/Reg สีเทา, ไม่มีข้อมูล = "-"
 * hideEmpty: ซ่อนแท็บที่ไม่มีเนื้อหา
 */
export function InfoTabs(props: { items: InfoTab[]; defaultValue?: string; hideEmpty?: boolean; class?: string }) {
  const has = (t: InfoTab) => (Array.isArray(t.content) ? t.content.length > 0 : !!t.content);
  const items = () => (props.hideEmpty ? props.items.filter(has) : props.items);
  const [value, setValue] = createSignal(props.defaultValue ?? items()[0]?.value);
  const current = () => items().find((x) => x.value === value()) ?? items()[0];
  return (
    <Show when={items().length > 0}>
      <section class={props.class}>
        {/* แท็บเดียว = หัวข้อธรรมดา (แถบแท็บเต็มความกว้างกดไม่ได้ ดูเหมือนปุ่ม · 2026-11-28) */}
        <Show
          when={items().length > 1}
          fallback={<h2 class="text-16 font-semibold text-dark">{items()[0]?.label}</h2>}
        >
          <PillTabs value={current()?.value ?? ""} onChange={setValue} items={items().map((x) => ({ value: x.value, label: x.label }))} />
        </Show>
        <div class={items().length > 1 ? "flex flex-col gap-1 pt-4" : "flex flex-col gap-1 pt-2"}>
          <Show when={current()?.heading}>
            <h2 class="text-14 font-semibold text-dark">{current()!.heading}</h2>
          </Show>
          <Show when={current() && has(current()!)} fallback={<p class="text-14 text-gray">-</p>}>
            <Show when={Array.isArray(current()!.content)} fallback={<p class="whitespace-pre-line text-14 text-gray">{current()!.content as string}</p>}>
              <ol class="list-decimal space-y-1 pl-4 text-14 text-gray">
                <For each={current()!.content as string[]}>{(line) => <li>{line}</li>}</For>
              </ol>
            </Show>
          </Show>
        </div>
      </section>
    </Show>
  );
}
