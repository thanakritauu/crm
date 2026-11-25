/**
 * class กลางของชั้นลอย (modal / dialog / sheet) — ทุก component ที่เปิดทับหน้าต้องใช้ชุดนี้
 * เพื่อให้ฉากหลัง ชั้น z-index อนิเมชัน และกรอบ modal เหมือนกันทั้งแอป
 */

/** ฉากหลังดำ 50% + fade เข้า/ออก */
export const overlayBackdrop =
  "fixed inset-0 z-modal bg-black/50 data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0";

/** ชั้นจัดกึ่งกลางจอสำหรับ modal (เว้นขอบจอ 16) */
export const overlayCenter = "fixed inset-0 z-modal flex items-center justify-center p-4";

/** กรอบ modal มาตรฐาน (Figma): กว้าง 343 · มุม 24 · พื้นขาว · เงา Card · อนิเมชันขยายเข้า/ออก — padding/gap ใส่ตามเนื้อหา */
export const modalPanel =
  "flex w-modal max-w-full flex-col rounded-3xl bg-white shadow-card data-[expanded]:animate-content-show data-[closed]:animate-content-hide";

/** bottom sheet: ชิดล่างในกรอบมือถือ มุมบน 24 + เลื่อนขึ้นตรงๆ จากล่าง / ลงตอนปิด (keyframes sheet-in/out คง translateX(-50%)) */
export const sheetPanel =
  "fixed-frame bottom-0 z-modal flex flex-col rounded-t-3xl bg-white data-[expanded]:animate-sheet-in data-[closed]:animate-sheet-out";
