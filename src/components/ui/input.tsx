import { Show, splitProps, type ComponentProps, type JSX } from "solid-js";
import { cn } from "~/lib/utils";

/** Label ของฟอร์ม (16/Medium Text/Black, เครื่องหมาย * สีแดงอยู่หน้าชื่อฟิลด์) ห่างช่องกรอก 4 */
export function Label(props: ComponentProps<"label"> & { required?: boolean }) {
  const [local, others] = splitProps(props, ["class", "children", "required"]);
  return (
    <label class={cn("mb-1 block text-left text-16 font-medium text-dark", local.class)} {...others}>
      <Show when={local.required}>
        <span class="text-error">* </span>
      </Show>
      {local.children}
    </label>
  );
}

type InputProps = ComponentProps<"input"> & {
  invalid?: boolean;
  /** ไอคอน/ข้อความด้านหน้า เช่น +66 */
  prefix?: JSX.Element;
  /** จัดข้อความในช่อง (ค่าเริ่มต้นชิดซ้าย) — center ใช้กับช่องตัวเลขระหว่างปุ่ม − / + */
  align?: "start" | "center";
};

/** กรอบช่องกรอกที่ใช้ร่วมกัน (input, select): สูง 48, มุม 12, ขอบ Stroke เข้ม, 14/Reg · error = ขอบแดง */
export const fieldBox = (invalid?: boolean) =>
  cn("h-12 w-full rounded-xl border bg-white px-4 text-14 text-dark transition-colors", invalid ? "border-error" : "border-stroke-strong");
const field = (invalid?: boolean) => cn(fieldBox(invalid), "flex items-center gap-2 focus-within:border-primary has-[:disabled]:bg-surface-gray");

/** select แบบ native หน้าตาเดียวกับ Input (วางลูกศรเองด้านขวา pr-10) */
export const selectClass = (invalid?: boolean) =>
  cn(fieldBox(invalid), "appearance-none pr-10 focus:border-primary focus:outline-none disabled:bg-surface-gray disabled:text-gray-disable");
const control = "h-full w-full min-w-0 bg-transparent text-14 text-dark placeholder:text-gray-placeholder focus:outline-none disabled:text-gray-disable";

/** ช่องกรอกข้อมูล (Figma: 14/Reg, placeholder Text/Placeholder) */
export function Input(props: InputProps) {
  const [local, others] = splitProps(props, ["class", "invalid", "prefix", "align"]);
  return (
    <div class={cn(field(local.invalid), local.class)}>
      <Show when={local.prefix}>
        <span class="shrink-0 text-14 text-gray">{local.prefix}</span>
      </Show>
      <input class={cn(control, local.align === "center" && "text-center")} aria-invalid={local.invalid} {...others} />
    </div>
  );
}

/** ข้อความแจ้งข้อผิดพลาดใต้ช่องกรอก (12/Reg สีแดง ห่าง 4) */
export function FieldError(props: { children?: JSX.Element }) {
  return (
    <Show when={props.children}>
      <p class="mt-1 text-12 text-error">{props.children}</p>
    </Show>
  );
}

/** กล่องแจ้งเตือนสีแดง (พื้น error-surface มุม 16 padding 16, 14/Reg) */
export function Alert(props: { title?: string; children?: JSX.Element; class?: string }) {
  return (
    <div class={cn("rounded-2xl bg-error-surface p-4 text-14 text-error", props.class)} role="alert">
      <Show when={props.title}>
        <span class="font-semibold">{props.title}</span>{" "}
      </Show>
      {props.children}
    </div>
  );
}
