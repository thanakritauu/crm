import { cn } from "~/lib/utils";

/**
 * แสดงข้อความนโยบาย/ความยินยอม (HTML จาก theme.consent) ด้วย innerHTML
 * ต้นฉบับ: <div class="grid grid-cols-1 gap-y-3 text-xs"> + innerHTML
 * สไตล์ของเนื้อหาอยู่ที่ .policy-html ใน src/app.css (14/Reg ย่อหน้าห่าง 8 — ใช้ token เดียวกับแอป)
 */
export function PolicyHtml(props: { html: string; class?: string }) {
  return <div class={cn("policy-html", props.class)} innerHTML={props.html} />;
}
