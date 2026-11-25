import { createStore } from "solid-js/store";
import { sessionActions } from "~/lib/session";
import { platformState, restorePlatformState, type PlatformKey } from "~/mocks/platforms";
import { platformService } from "~/services/platform-service";

/**
 * บริการสะสมคะแนน (แทน API ของต้นฉบับ: qr-code / loyalty-mapping sync)
 *
 * QR (กติกาจำลอง):
 *  - รหัสขึ้นต้นด้วย "CHARMISS-" และยังไม่เคยใช้ → ได้ 150 คะแนน
 *  - รหัสเดิมสแกนซ้ำ → "คิวอาร์โค้ดนี้ถูกใช้งานแล้ว"
 *  - รหัสอื่น / อ่าน QR จากรูปไม่ได้ → "ไม่พบคิวอาร์โค้ดนี้ในระบบ"
 *  QR ตัวอย่างสำหรับทดสอบอยู่ที่ /prototype/qr
 *
 * อัปเดตคะแนนจากแพลตฟอร์มออนไลน์:
 *  - ยังไม่เชื่อมต่อแพลตฟอร์มใด → not_connected
 *  - แต่ละแพลตฟอร์มที่เชื่อมต่อ มีคำสั่งซื้อจำลองรอซิงก์ 1 รายการ (+50 คะแนน) ซิงก์ได้ครั้งเดียว
 *  - ไม่มีคำสั่งซื้อใหม่ → up_to_date
 */
export const QR_PREFIX = "CHARMISS-";
export const QR_POINTS = 150;
export const PLATFORM_ORDER_POINTS = 50;

export type QrResult = { status: "success"; code: string; points: number } | { status: "not_found" | "used"; code?: string };
export type SyncResult =
  | { status: "not_connected" }
  | { status: "up_to_date" }
  | { status: "success"; points: number; orders: { platform: string; order_id: string }[] };

type EarnState = { usedQrCodes: string[]; syncedPlatforms: PlatformKey[] };

const STORAGE_KEY = "charmiss-prototype-earn-v1";
const initialState = (): EarnState => ({ usedQrCodes: [], syncedPlatforms: [] });
const [state, setState] = createStore<EarnState>(initialState());

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/** เลขคำสั่งซื้อจำลองคงที่ต่อแพลตฟอร์ม */
const mockOrderId = (platform: PlatformKey) => `${platform.slice(0, 2).toUpperCase()}${(2611200000 + platform.length * 7919).toString()}`;

export const earnService = {
  /** โหลดสถานะที่เคยบันทึก — เรียกหลัง mount (ฝั่ง client) */
  restore() {
    restorePlatformState();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...initialState(), ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  },

  reset() {
    setState(initialState());
    persist();
  },

  /** ตรวจรหัสจาก QR · `null` = อ่าน QR ไม่ได้ (เช่น รูปที่ไม่มี QR) */
  checkQr(raw: string | null): QrResult {
    const code = raw?.trim().toUpperCase();
    if (!code || !code.startsWith(QR_PREFIX) || code.length <= QR_PREFIX.length) return { status: "not_found", code };
    if (state.usedQrCodes.includes(code)) return { status: "used", code };
    return { status: "success", code, points: QR_POINTS };
  },

  /** บันทึกว่าใช้รหัสแล้ว (เรียกหลังให้คะแนน/แสตมป์สำเร็จ) */
  markQrUsed(code: string) {
    setState("usedQrCodes", (list) => [...list, code.trim().toUpperCase()]);
    persist();
  },

  /** สแกน QR ในโหมดปกติ: ตรวจ + ให้คะแนน + ลงประวัติ */
  redeemQr(raw: string | null): QrResult {
    const r = earnService.checkQr(raw);
    if (r.status === "success") {
      earnService.markQrUsed(r.code);
      sessionActions.addPoints(r.points, { key: "hist.earned_qr", params: { points: r.points, code: r.code } }, "QR Code");
    }
    return r;
  },

  /** ซิงก์คำสั่งซื้อจากแพลตฟอร์มที่เชื่อมต่อแล้ว */
  syncPlatforms(): SyncResult {
    const connected = platformService.list().filter((p) => p.status);
    if (connected.length === 0) return { status: "not_connected" };
    const pending = connected.filter((p) => !state.syncedPlatforms.includes(p.platform));
    if (pending.length === 0) return { status: "up_to_date" };
    const orders = pending.map((p) => ({ platform: p.display_name, order_id: mockOrderId(p.platform) }));
    for (const o of orders) {
      sessionActions.addPoints(
        PLATFORM_ORDER_POINTS,
        { key: "hist.earned_platform", params: { points: PLATFORM_ORDER_POINTS, product: "Glow Setting Powder Translucent", platform: o.platform, order: o.order_id } },
        o.platform,
      );
    }
    setState("syncedPlatforms", (list) => [...list, ...pending.map((p) => p.platform)]);
    persist();
    return { status: "success", points: orders.length * PLATFORM_ORDER_POINTS, orders };
  },

  /** รหัส QR ที่ใช้ไปแล้ว */
  usedQrCodes: () => [...state.usedQrCodes],

  /** จำนวนแพลตฟอร์มที่เชื่อมต่อ (ใช้แสดงผล) */
  connectedCount: () => Object.values(platformState.bindings).filter(Boolean).length,
};
