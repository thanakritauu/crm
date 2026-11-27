import { onCleanup, onMount } from "solid-js";

/**
 * FlyToHome — ระบบกลาง: ได้คะแนนหรือคอยน์เมื่อไร เหรียญปลิวจากกลางจอไปที่ยอดของมัน (2026-11-25)
 *   ได้คะแนน → เหรียญ P ปลิว · ได้คอยน์ → เหรียญ C ปลิว
 * - ปลายทาง (target):
 *   "points" = คะแนน → ยอดคะแนนในหัวหน้าหน้าสะสมคะแนน ([data-fly-target="points"]) ถ้ามีบนจอ ไม่มี = ปุ่มหน้าแรก (2026-11-27)
 *   "coins" = คอยน์หลัก → ยอดคอยน์ในหัวหน้าหน้าภารกิจ ([data-fly-target="coins"]) ถ้ามีบนจอ ไม่มี = ปุ่ม "ภารกิจ" ในเมนูล่าง (2026-11-27)
 *   "home" = ปุ่ม "หน้าแรก" ในเมนูล่าง ([data-nav="home"])
 *   "mission-coins:<id>" = ยอด "คอยน์ของภารกิจนี้" ในหน้าภารกิจสะสมคอยน์ ([data-fly-target="…"])
 * - จุดที่ส่ง: sessionActions.addPoints / addCoins (→ home) · missionService.addMissionCoins (→ mission-coins:<id>)
 *   ช่องทางใหม่ที่ให้คะแนน/คอยน์ ต้องเรียกฟังก์ชันเหล่านี้เท่านั้น (ห้ามแก้ยอดเอง) แอนิเมชันจะมาเอง · ยอดติดลบ (ใช้/แลก) ไม่เล่น
 * - ได้หลายครั้งติดกัน (เช่น ซิงก์หลายแพลตฟอร์มพร้อมกัน) → รวมเป็นปลิวครั้งเดียวต่อสกุล+ปลายทาง
 * - ตอนได้ อยู่หน้าที่ไม่มีปลายทาง (เช่น หน้ากรอกใบเสร็จ) → เก็บไว้ แล้วปลิวตอนปลายทางโผล่ (emitFlyTargetReady)
 * - ถึงแล้วปลายทางเด้งเบาๆ + ส่ง "charmiss:fly-arrived" → ตัวเลขที่รอ (CountUp waitFor) เริ่มนับขึ้นตอนเหรียญถึง
 * - เคารพ prefers-reduced-motion (ไม่เล่น)
 */
type Unit = "points" | "coins";
type Flight = { unit: Unit; target: string };
const ICON: Record<Unit, string> = { points: "/images/icons/point.png", coins: "/images/icons/coin.png" };
const COUNT = 7;

/** เที่ยวบินที่รอปลายทางโผล่ (ระดับโมดูล — CountUp ถามได้ว่ามีเหรียญกำลังจะมาไหม) */
let pending: Flight[] = [];
export const flightPending = (target: string) => pending.some((f) => f.target === target);

export const emitEarned = (unit: Unit, amount: number, target = "home") => {
  if (typeof window === "undefined" || amount <= 0) return;
  window.dispatchEvent(new CustomEvent("charmiss:earned", { detail: { unit, amount, target } }));
};
/** ปลายทางเพิ่งแสดงบนจอ (เมนูล่าง / ยอดคอยน์ภารกิจ) → ปลิวเที่ยวที่ค้างอยู่ */
export const emitFlyTargetReady = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("charmiss:fly-target-ready"));
};

const selector = (target: string) => (target === "home" ? '[data-nav="home"]' : `[data-fly-target="${target}"]`);
/** "points" = ยอดคะแนนในหัวหน้าหน้าสะสมคะแนน ถ้ามีบนจอ · ไม่มี = ปุ่มหน้าแรกในเมนูล่าง (2026-11-27) */
/** "coins" = ยอดคอยน์ในหัวหน้าหน้าภารกิจ ถ้ามีบนจอ · ไม่มี = ปุ่ม "ภารกิจ" ในเมนูล่าง (ไม่ไปหน้าแรกแล้ว — หน้าแรกไม่แสดงคอยน์ · 2026-11-27) */
const find = (target: string) =>
  target === "points"
    ? document.querySelector<HTMLElement>('[data-fly-target="points"]') ?? document.querySelector<HTMLElement>('[data-nav="home"]')
    : target === "coins"
      ? document.querySelector<HTMLElement>('[data-fly-target="coins"]') ?? document.querySelector<HTMLElement>('[data-nav="missions"]')
      : document.querySelector<HTMLElement>(selector(target));

export function FlyToHome() {
  const queued = new Set<string>();

  const locate = (target: string) => {
    const el = find(target);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (!r.width) return null;
    const isNav = el.hasAttribute("data-nav");
    return { el, x: r.left + r.width / 2, y: isNav ? r.top + 12 : r.top + r.height / 2 };
  };

  const fly = (f: Flight) => {
    const to = locate(f.target);
    if (!to) {
      if (!pending.some((p) => p.unit === f.unit && p.target === f.target)) pending = [...pending, f];
      return;
    }
    const sx = window.innerWidth / 2;
    const sy = window.innerHeight / 2;
    let done = 0;
    for (let i = 0; i < COUNT; i++) {
      const img = document.createElement("img");
      img.src = ICON[f.unit];
      img.alt = "";
      img.setAttribute("aria-hidden", "true");
      img.className = "pointer-events-none fixed left-0 top-0 z-loading size-8 drop-shadow-card";
      document.body.appendChild(img);
      // กระจายรอบกลางจอก่อน แล้วโค้งไปที่ปลายทาง
      const angle = (Math.PI * 2 * i) / COUNT + Math.random() * 0.6;
      const spread = 40 + Math.random() * 40;
      const mx = sx + Math.cos(angle) * spread;
      const my = sy + Math.sin(angle) * spread;
      const p = (x: number, y: number, s: number) => `translate(${x - 16}px, ${y - 16}px) scale(${s})`;
      const anim = img.animate(
        [
          { transform: p(sx, sy, 0.4), opacity: 0 },
          { transform: p(mx, my, 1.1), opacity: 1, offset: 0.25 },
          { transform: p(mx, my - 10, 1), opacity: 1, offset: 0.4 },
          { transform: p(to.x, to.y, 0.5), opacity: 0.9 },
        ],
        { duration: 1000, delay: i * 70, easing: "cubic-bezier(.5,0,.6,1)", fill: "both" },
      );
      anim.onfinish = () => {
        img.remove();
        // เหรียญดวงแรกถึง → ตัวเลขเริ่มนับ · ดวงสุดท้ายถึง → ปลายทางเด้ง
        if (++done === 1) window.dispatchEvent(new CustomEvent("charmiss:fly-arrived", { detail: { target: f.target } }));
        if (done === COUNT) to.el.animate([{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }], { duration: 300, easing: "ease-out" });
      };
    }
  };

  onMount(() => {
    const onEarned = (e: Event) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const f = (e as CustomEvent<Flight>).detail;
      const key = `${f.unit}|${f.target}`;
      // รอให้ modal/หน้าผลลัพธ์ขึ้นก่อนนิดหนึ่ง · ระหว่างรอ ได้ซ้ำ → นับเป็นครั้งเดียว
      if (queued.has(key)) return;
      queued.add(key);
      setTimeout(() => {
        queued.delete(key);
        fly({ unit: f.unit, target: f.target });
      }, 250);
    };
    const onReady = () => {
      if (!pending.length) return;
      setTimeout(() => {
        const ready = pending.filter((f) => locate(f.target));
        pending = pending.filter((f) => !ready.includes(f));
        ready.forEach(fly);
      }, 400);
    };
    window.addEventListener("charmiss:earned", onEarned);
    window.addEventListener("charmiss:fly-target-ready", onReady);
    onCleanup(() => {
      window.removeEventListener("charmiss:earned", onEarned);
      window.removeEventListener("charmiss:fly-target-ready", onReady);
    });
  });
  return null;
}
