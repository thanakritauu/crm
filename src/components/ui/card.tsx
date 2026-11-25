import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "~/lib/utils";

/** หน้าตาการ์ด (พื้นขาว มุม 16 + เงา Card) — ใช้กับ element อื่นที่ต้องเป็นการ์ด เช่น <A>, <li>, <button> */
export const cardClass = "rounded-2xl bg-white shadow-card";

/** Card — พื้นขาว มุม 16 + เงา Card (Figma effect "Card") · padding ใส่เองตามเนื้อหา (ปกติ p-4) */
export function Card(props: ComponentProps<"div">) {
  const [local, others] = splitProps(props, ["class"]);
  return <div class={cn(cardClass, local.class)} {...others} />;
}
