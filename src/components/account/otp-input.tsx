import { For } from "solid-js";

/**
 * ช่องกรอก OTP 6 ช่อง — กล่อง 48×48 ห่าง 8 มุม 12 ขอบ Stroke เข้ม (focus ชมพู) ตัวเลข 16/Semi ตรงกลาง
 * พิมพ์แล้วเลื่อนไปช่องถัดไป, Backspace ในช่องว่างย้อนกลับ, วางเลข 6 หลักได้
 */
export function OtpInput(props: { value: string[]; onChange: (value: string[]) => void; disabled?: boolean }) {
  const focus = (i: number) => document.getElementById(`otp-${i}`)?.focus();

  const handleInput = (e: InputEvent & { currentTarget: HTMLInputElement }, i: number) => {
    const digits = e.currentTarget.value.replace(/\D/g, "");
    const next = [...props.value];
    if (digits.length > 1) {
      // วางหลายหลักพร้อมกัน
      digits.slice(0, 6 - i).split("").forEach((d, k) => (next[i + k] = d));
      props.onChange(next);
      focus(Math.min(i + digits.length, 5));
      return;
    }
    next[i] = digits;
    e.currentTarget.value = digits;
    props.onChange(next);
    if (digits && i < 5) focus(i + 1);
  };

  const handleKeyDown = (e: KeyboardEvent & { currentTarget: HTMLInputElement }, i: number) => {
    if (e.key === "Backspace" && !e.currentTarget.value && i > 0) focus(i - 1);
  };

  return (
    <div class="flex justify-center gap-2">
      <For each={Array.from({ length: 6 }, (_, i) => i)}>
        {(i) => (
          <input
            id={`otp-${i}`}
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxLength={6}
            disabled={props.disabled}
            value={props.value[i] ?? ""}
            onInput={(e) => handleInput(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            class="size-12 min-w-0 shrink rounded-xl border border-stroke-strong bg-white p-0 text-center text-16 font-semibold text-dark focus:border-primary focus:outline-none disabled:bg-surface-gray"
          />
        )}
      </For>
    </div>
  );
}
