/** แถบความคืบหน้า — ราง Surface/Gray สูง 4 + แถบ teriary */
export function Progress(props: { value: number; max: number; showLabel?: boolean }) {
  const pct = () => Math.min(100, Math.round((props.value / Math.max(1, props.max)) * 100));
  return (
    <div class="flex items-center gap-x-2">
      <div class="relative flex h-1 min-w-0 flex-grow items-center overflow-hidden rounded-full bg-surface-gray">
        <div class="h-1 rounded-full bg-teriary transition-[width]" style={{ width: `${pct()}%` }} />
      </div>
      {props.showLabel !== false && (
        <span class="shrink-0 whitespace-nowrap text-12 font-semibold text-dark">
          {props.value}/{props.max}
        </span>
      )}
    </div>
  );
}
