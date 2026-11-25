import { cva, type VariantProps } from "class-variance-authority";
import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "~/lib/utils";

/**
 * Button — ปุ่มตาม Design System (Figma): ทรงแคปซูล ตัวอักษรหนา
 *
 * variant
 * - primary   พื้นชมพู ตัวขาว (ปุ่มหลัก)
 * - secondary พื้นชมพูอ่อน (Surface/Pink) ตัวชมพู (ปุ่มรอง เช่น "ยกเลิก")
 * - outline   ขอบชมพู พื้นขาว
 * - white     พื้นขาว ตัวชมพู (วางบนพื้นสี เช่น การ์ดสมาชิก)
 * - ghost / link  ไม่มีพื้น
 * - line      ปุ่มเข้าสู่ระบบด้วย LINE
 * - muted     หน้าตาแบบกดไม่ได้ (Surface/Gray + Text/Disable) — ปุ่ม disabled ทุกแบบจะเป็นหน้าตานี้อัตโนมัติ
 *
 * size (ฐาน 8): lg = 48px (16/Semi) · md = 40px (14/Semi) · sm = 32px (14/Semi) · icon = 40×40
 * `block` = lg + เต็มความกว้าง
 *
 * ชื่อเดิม (brand, brand-soft, chip, default, dialog) ยังใช้ได้ — แมปไปยังชื่อใหม่
 */
const variant = {
  primary: "bg-primary text-white",
  secondary: "bg-primary-surface text-primary",
  outline: "border border-primary bg-white text-primary",
  white: "bg-white text-primary",
  ghost: "bg-transparent text-primary",
  link: "h-auto bg-transparent px-0 text-primary underline-offset-4 hover:underline",
  line: "bg-platform-line text-white",
  muted: "bg-surface-gray text-gray-disable",
  error: "bg-error text-white",
  // แดงจาง (ปุ่มรองที่เป็นการลบ/ยกเลิก เช่น "ยกเลิกเชื่อมต่อ")
  "error-soft": "bg-error-surface text-error",
};
const size = {
  lg: "h-12 px-4 text-16 font-semibold",
  md: "h-10 px-4 text-14 font-semibold",
  sm: "h-8 px-4 text-14 font-semibold",
  icon: "size-10 p-0",
  block: "h-12 w-full px-4 text-16 font-semibold",
};

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:border-transparent disabled:bg-surface-gray disabled:text-gray-disable",
  {
    variants: {
      variant: {
        ...variant,
        // ชื่อเดิม
        default: variant.primary,
        brand: variant.primary,
        "brand-soft": variant.secondary,
        chip: variant.secondary,
        destructive: variant.error,
      },
      size: {
        ...size,
        // ชื่อเดิม
        default: size.md,
        dialog: "h-12 w-full flex-1 px-4 text-16 font-semibold",
        // ชิปตัวกรอง (ทุกหน้า): สูง 32 · 14/Medium — ไม่ใช่ Semibold แบบปุ่ม
        chip: "h-8 px-4 text-14 font-medium",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export function Button(props: ButtonProps) {
  const [local, others] = splitProps(props, ["variant", "size", "class"]);
  return <button type="button" class={cn(buttonVariants({ variant: local.variant, size: local.size }), local.class)} {...others} />;
}
