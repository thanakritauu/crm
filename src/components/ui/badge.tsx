import { cva, type VariantProps } from "class-variance-authority";
import type { JSX } from "solid-js";
import { cn } from "~/lib/utils";

/** ป้ายสถานะ ทรงแคปซูล 12/Medium — sm/md padding 8 แนวนอน · lg padding 16×4 */
export const badgeVariants = cva("inline-flex items-center gap-x-1 rounded-full font-medium whitespace-nowrap", {
  variants: {
    tone: {
      teriary: "bg-warning-surface text-teriary",
      primary: "bg-primary-surface text-primary",
      secondary: "bg-secondary-surface text-secondary",
      success: "bg-success-surface text-success",
      error: "bg-error-surface text-error",
      gray: "bg-surface-gray text-gray",
      new: "bg-error text-white",
    },
    size: {
      sm: "px-2 py-0 text-12",
      md: "px-2 py-0 text-12",
      lg: "px-4 py-1 text-12",
    },
  },
  defaultVariants: { tone: "teriary", size: "md" },
});

export function Badge(props: VariantProps<typeof badgeVariants> & { class?: string; children: JSX.Element }) {
  return <span class={cn(badgeVariants({ tone: props.tone, size: props.size }), props.class)}>{props.children}</span>;
}
