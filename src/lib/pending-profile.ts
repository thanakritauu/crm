import type { Customer } from "~/mocks/customer";

/**
 * ข้อมูลส่วนตัวที่รอยืนยัน OTP (กรณีเปลี่ยนเบอร์มือถือ)
 * หน้า personal-information เก็บไว้ → หน้า verify-by-phone?action=change_phone ยืนยัน OTP แล้วบันทึกจริง
 * เก็บใน sessionStorage (หายเมื่อปิดแท็บ เหมือนสถานะชั่วคราวของฟอร์ม)
 */
export type PendingProfile = Pick<Customer, "name" | "surname" | "phone" | "email" | "birthday" | "gender">;

const KEY = "charmiss-prototype-pending-profile";

export const pendingProfile = {
  save(p: PendingProfile) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(p));
    } catch {
      /* ignore */
    }
  },
  load(): PendingProfile | undefined {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as PendingProfile) : undefined;
    } catch {
      return undefined;
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  },
};
