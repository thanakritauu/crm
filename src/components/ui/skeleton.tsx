import { cn } from "~/lib/utils";

/** Skeleton ระหว่างโหลด — gradient Surface/Gray → Stroke เข้ม + animate-pulse มุม 8 */
export function Skeleton(props: { class?: string }) {
  return <div class={cn("animate-pulse rounded-lg bg-gradient-to-r from-surface-gray via-stroke-strong to-surface-gray", props.class)} />;
}
