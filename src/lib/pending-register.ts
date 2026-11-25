/**
 * ข้อมูลสมัครสมาชิกที่รอยืนยัน OTP — หน้า register เก็บไว้ → verify-by-phone?action=register&phone=… ยืนยันแล้วบันทึกจริง
 * เก็บใน sessionStorage (หายเมื่อปิดแท็บ)
 */
export type PendingRegister = { name: string; surname: string; phone: string; id_card?: string };
const KEY = "charmiss-prototype-pending-register";

export const pendingRegister = {
  save(p: PendingRegister) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(p));
    } catch {
      /* ignore */
    }
  },
  load(): PendingRegister | undefined {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as PendingRegister) : undefined;
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
