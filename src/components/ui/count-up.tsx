import { createEffect, createSignal, on, onCleanup, onMount } from "solid-js";
import { emitFlyTargetReady, flightPending } from "~/components/layout/fly-to-home";
import { formatNumber } from "~/lib/utils";

/**
 * ตัวเลขนับขึ้น/ลง (counting) — ใช้กับยอดคะแนน/คอยน์หน้าแรก
 * - จำตัวเลขที่แสดงล่าสุดไว้ใน sessionStorage (`count:<id>`) → เปิดหน้าใหม่แล้วยอดเปลี่ยน (ได้คะแนน / ใช้แลก) จะนับจากยอดเดิมไปยอดใหม่
 * - ยอดเปลี่ยนขณะอยู่หน้าเดิม (กดรีเฟรชแล้วได้คะแนน) ก็นับเช่นกัน · ครั้งแรกสุด (ยังไม่เคยจำ) แสดงยอดทันที
 * - waitFor = ปลายทางของเหรียญปลิว (FlyToHome) → ถ้ามีเหรียญกำลังจะมา ค้างยอดเดิมไว้ แล้วเริ่มนับตอนเหรียญถึง (กันเหรียญหลุด 3 วิ → นับเลย)
 * - ผู้ใช้ตั้งลดการเคลื่อนไหว (prefers-reduced-motion) → แสดงยอดทันที
 */
export function CountUp(props: { value: number; id: string; duration?: number; waitFor?: string }) {
  const key = () => `count:${props.id}`;
  const [shown, setShown] = createSignal(props.value);
  let raf = 0;

  const remember = (v: number) => {
    try {
      sessionStorage.setItem(key(), String(v));
    } catch {
      /* ignore */
    }
  };
  const animate = (from: number, to: number) => {
    cancelAnimationFrame(raf);
    if (from === to || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(to);
      return remember(to);
    }
    const start = performance.now();
    const dur = props.duration ?? 900;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
      else remember(to);
    };
    raf = requestAnimationFrame(step);
  };

  onMount(() => {
    // cleanup ลงทะเบียนเฉพาะฝั่ง client (บน server ไม่มี cancelAnimationFrame — เคยทำให้ dev server ล่ม)
    onCleanup(() => cancelAnimationFrame(raf));
    let prev: number | undefined;
    try {
      const raw = sessionStorage.getItem(key());
      prev = raw === null ? undefined : Number(raw);
    } catch {
      prev = undefined;
    }
    if (prev === undefined || Number.isNaN(prev)) return remember(props.value);
    const from = prev;
    const target = props.waitFor;
    if (!target || !flightPending(target) || from === props.value) return animate(from, props.value);
    // เหรียญกำลังปลิวมาที่ยอดนี้ → ค้างยอดเดิม รอเหรียญถึงแล้วค่อยนับ
    setShown(from);
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      window.removeEventListener("charmiss:fly-arrived", onArrived);
      clearTimeout(fallback);
      animate(from, props.value);
    };
    const onArrived = (e: Event) => (e as CustomEvent<{ target: string }>).detail.target === target && start();
    window.addEventListener("charmiss:fly-arrived", onArrived);
    const fallback = setTimeout(start, 3000);
    onCleanup(() => {
      window.removeEventListener("charmiss:fly-arrived", onArrived);
      clearTimeout(fallback);
    });
    emitFlyTargetReady();
  });
  createEffect(on(() => props.value, (v, old) => old !== undefined && animate(shown(), v), { defer: true }));

  return <>{formatNumber(shown())}</>;
}
