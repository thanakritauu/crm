import type { ParentComponent } from "solid-js";

/**
 * MobileFrame — เฉพาะ prototype
 * ค่าเริ่มต้น: เต็มความกว้างจอเหมือนต้นฉบับ (mobile first, responsive)
 * เมื่อเปิด "กรอบมือถือ" ในเมนู prototype (html[data-frame="mobile"]) จะจำกัดกว้าง 480px จัดกลาง ไว้นำเสนอบนจอคอม
 * ลบ component นี้ได้เมื่อนำไปใช้จริง
 */
export const MobileFrame: ParentComponent = (props) => (
  <div class="mobile-frame relative mx-auto min-h-screen w-full max-w-[var(--frame-width)] overflow-x-hidden bg-white">
    {props.children}
  </div>
);

const FRAME_KEY = "charmiss-prototype-frame";

/** อ่าน/ตั้งค่าโหมดกรอบมือถือ (เก็บใน localStorage) */
export function applyFrameMode(mode?: "mobile" | "full") {
  try {
    const m = mode ?? (localStorage.getItem(FRAME_KEY) as "mobile" | "full" | null) ?? "full";
    if (mode) localStorage.setItem(FRAME_KEY, mode);
    if (m === "mobile") document.documentElement.setAttribute("data-frame", "mobile");
    else document.documentElement.removeAttribute("data-frame");
    return m;
  } catch {
    return "full";
  }
}
