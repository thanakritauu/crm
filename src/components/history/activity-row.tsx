import { createSignal, For, Show, type Component, type JSX } from "solid-js";
import { Dynamic } from "solid-js/web";
import { EmptyData } from "~/components/ui/empty-data";
import { IconChevronDown } from "~/components/ui/icons";
import { useI18n } from "~/lib/i18n";
import { cn } from "~/lib/utils";

/**
 * แถวรายการแบบหน้าการแจ้งเตือน (Figma "Noti" 400:7351) — ใช้ร่วมกัน: การแจ้งเตือน / ประวัติคะแนน / ประวัติคอยน์
 * - แถวเต็มความกว้าง p-4 + เส้นคั่นล่าง · ห่างกัน 8
 * - วงกลม 24px พื้นชมพูอ่อน + ไอคอน 12px สีชมพู (จุดแดง = ยังไม่อ่าน)
 * - ข้อความ 14/Semibold สีเข้ม (clamp = ตัดที่ 2 บรรทัด ใช้ในหน้าการแจ้งเตือนตาม Figma · ประวัติแสดงครบเพื่อไม่ให้ข้อมูล เช่น เลขที่คำสั่งซื้อ หาย) · จำนวน (ถ้ามี) 14/Semibold ชิดขวา เขียว=ได้รับ แดง=ใช้ เข้ม=เป็นกลาง
 * - บรรทัดล่าง 12 สีเทา เยื้อง 32px: วันที่ · ที่มา (ถ้ามี)
 * - details: รายการย่อย กดลูกศรเพื่อขยาย (เช่น สินค้าหลายชิ้นในใบเสร็จ)
 */
export function ActivityRow(props: {
  icon: Component<{ size?: number; class?: string }>;
  title: JSX.Element;
  date: string;
  source?: string;
  amount?: { text: string; tone: "success" | "error" | "dark" };
  unread?: boolean;
  details?: { name: string; amount: string }[];
  onClick?: () => void;
  clamp?: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = createSignal(false);
  const hasDetails = () => !!props.details?.length;
  return (
    <div class="flex w-full flex-col gap-2 border-b border-stroke p-4">
      <Dynamic
        component={props.onClick ? "button" : "div"}
        {...(props.onClick ? { type: "button", onClick: props.onClick } : {})}
        class={cn("flex w-full items-start gap-2 text-left", props.onClick && "active:opacity-70")}
      >
        {/* ไอคอนหน้าแถว = ม่วงอ่อน + ไอคอนม่วง (ข้อมูล · DSL บทบาทสี 2026-11-28) */}
        <span class="relative flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary-surface">
          <Dynamic component={props.icon} size={12} class="text-secondary" />
          <Show when={props.unread}>
            <span class="absolute -right-0.5 -top-0.5 size-2 rounded-full border border-white bg-error" aria-label={t("noti.unread")} />
          </Show>
        </span>
        {/* ตัวปกติ ให้ตัวเลขด้านขวาเด่น · แจ้งเตือนที่ยังไม่อ่าน = ตัวหนา (แยกอ่านแล้ว/ยังไม่อ่าน · 2026-11-28) */}
        <span class={cn("min-w-0 flex-1 whitespace-pre-line text-14 text-dark", props.unread ? "font-semibold" : "font-normal", props.clamp && "line-clamp-2")}>{props.title}</span>
        <Show when={props.amount}>
          {(a) => (
            <span class={cn("shrink-0 whitespace-nowrap text-14 font-semibold", a().tone === "success" ? "text-success" : a().tone === "error" ? "text-error" : "text-dark")}>
              {a().text}
            </span>
          )}
        </Show>
      </Dynamic>
      <div class="flex items-center justify-between gap-2 pl-8">
        <span class="text-12 text-gray">
          {props.date}
          <Show when={props.source}>
            {" · "}
            {props.source}
          </Show>
        </span>
        <Show when={hasDetails()}>
          <button type="button" class="hit-area flex items-center gap-1 text-12 font-medium text-primary" onClick={() => setOpen(!open())}>
            {t("core.view_details")}
            <IconChevronDown size={16} class={cn("transition", open() && "rotate-180")} />
          </button>
        </Show>
      </div>
      <Show when={open()}>
        <ul class="flex flex-col gap-1 pl-8">
          <For each={props.details}>
            {(d) => (
              <li class="flex items-center justify-between gap-2 text-12">
                <span class="text-gray">{d.name}</span>
                <span class="font-semibold text-success">{d.amount}</span>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  );
}

/** หัวข้อกลุ่ม (เช่น เดือน) ในรายการ — 14/Semibold เว้นขอบ 16 */
export const ActivityGroupTitle = (props: { children: JSX.Element }) => <h3 class="px-4 pt-4 text-14 font-semibold text-dark">{props.children}</h3>;

/** สถานะว่างของรายการ — กึ่งกลางพื้นที่ใต้ header เหมือนหน้าการแจ้งเตือน */
export const ActivityEmpty = (props: { title: string; description?: string; icon?: Parameters<typeof EmptyData>[0]["icon"]; action?: { label: string; href: string } }) => (
  <div class="flex min-h-[60vh] items-center justify-center">
    <EmptyData title={props.title} description={props.description} icon={props.icon} action={props.action} />
  </div>
);
