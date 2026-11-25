import { translate } from "~/lib/i18n";
import { sessionActions } from "~/lib/session";
import { rewardService } from "~/services/reward-service";
import { createStore } from "solid-js/store";
import { leaderboard, missionCouponCodes, missions, type LeaderboardEntry, type Mission, type MissionStatus } from "~/mocks/missions";
import { emitEarned } from "~/components/layout/fly-to-home";

/**
 * ต้นฉบับเรียก API (event-service / event-joined-service / customer-event-point-service)
 * prototype คืนข้อมูลจำลองแบบ sync + เก็บความคืบหน้าของภารกิจ (เริ่มภารกิจ, แสตมป์, ตอบ quiz, แลกรางวัล)
 * ไว้ใน store แยก (บันทึกลง localStorage) แล้ว merge ทับ mock ตอนอ่าน
 */
type MissionProgress = {
  status?: MissionStatus;
  progress?: number;
  redeemed_code?: string;
  /** ภารกิจสะสมคอยน์: คอยน์คงเหลือของภารกิจ · รางวัลที่แลกแล้ว */
  coin_balance?: number;
  redeemed_rewards?: string[];
  /** แสดง modal "ยินดีด้วย" แล้ว */
  celebrated?: boolean;
  /** ภารกิจเช็คอิน: วันที่เช็คอินล่าสุด (YYYY-MM-DD เวลาไทย) */
  last_checkin?: string;
};

/** วันนี้ตามเวลาไทย (YYYY-MM-DD) */
const todayTH = (now = Date.now()) => new Date(now + 7 * 3_600_000).toISOString().slice(0, 10);

const STORAGE_KEY = "charmiss-prototype-missions-v1";
const [state, setState] = createStore<Record<string, MissionProgress>>({});

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

const merge = (m: Mission): Mission & { redeemed_code?: string } => {
  const p = state[m.id];
  return p ? { ...m, ...p } : m;
};

export const missionService = {
  list: (): (Mission & { redeemed_code?: string })[] => missions.map(merge),
  get: (id: string) => {
    const m = missions.find((x) => x.id === id);
    return m ? merge(m) : undefined;
  },
  leaderboard: (_missionId: string): LeaderboardEntry[] => leaderboard,
  couponCode: (id: string) => missionCouponCodes[id] ?? `CHM-${id.toUpperCase()}`,

  /** โหลดความคืบหน้าที่เคยบันทึก — เรียกหลัง mount (ฝั่ง client) */
  restore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  },
  reset() {
    for (const k of Object.keys(state)) setState(k, undefined!);
    persist();
  },

  /** เริ่มภารกิจ (ต้นฉบับ: POST customer-event-point join) */
  start(id: string) {
    const m = missionService.get(id);
    if (!m || m.status !== "not_started") return;
    setState(id, { ...state[id], status: "in_progress" });
    persist();
  },

  /** ภารกิจเช็คอิน: วันนี้เช็คอินแล้วหรือยัง */
  checkedInToday: (m: Mission & { last_checkin?: string }) => m.last_checkin === todayTH(),

  /**
   * ภารกิจเช็คอิน: กดเช็คอินวันละ 1 ครั้งที่หน้ารายละเอียด → +1 วัน (ครบ = ได้คอยน์รางวัล)
   * (ของจริงนับอัตโนมัติเมื่อเปิดแอป — prototype ให้กดเองเพื่อดูความคืบหน้า)
   */
  checkIn(id: string): { variant: "success" | "error"; title: string; description?: string } {
    const t = translate;
    const m = missionService.get(id);
    if (!m || m.type !== "checkin") return { variant: "error", title: t("common.notifications.mission.not_found") };
    if (m.status === "expired") return { variant: "error", title: t("mis.collect_expired_title"), description: t("mis.collect_closed_desc") };
    if (m.status === "completed") return { variant: "error", title: t("mis.collect_completed_title"), description: t("mis.collect_closed_desc") };
    if (missionService.checkedInToday(m)) return { variant: "error", title: t("mis.checked_in_today"), description: t("mis.checkin_come_back") };
    missionService.start(id);
    const done = missionService.addProgress(id, 1);
    setState(id, { ...state[id], last_checkin: todayTH() });
    persist();
    const after = missionService.get(id)!;
    if (done) {
      sessionActions.addCoins(m.reward_coins, { key: "loyalty.history_mission", params: { name: m.title } });
      return { variant: "success", title: t("core.earned_coins_done", { coins: m.reward_coins }), description: t("common.mission_success_message") };
    }
    return { variant: "success", title: t("mis.checkin_success"), description: t("core.progress", { progress: after.progress, target: after.target }) };
  },

  /**
   * สะสมให้ภารกิจ 1 ครั้ง (ถ่ายรูปใบเสร็จ / สแกน QR / กรอกเลขที่ใบเสร็จ / รหัสสินค้า) — ใช้ร่วมกันทุกช่องทาง
   * คืนข้อความผลลัพธ์สำหรับ ResultModal
   * - ภารกิจสะสมคอยน์ → คอยน์เข้าภารกิจ · แสตมป์ → +1 (ครบ = ได้คอยน์รางวัล)
   * - ทำสำเร็จแล้ว / หมดเวลา → แจ้งว่าสะสมเพิ่มไม่ได้ (ไม่นับซ้ำ)
   */
  collect(id: string): { variant: "success" | "error"; title: string; description?: string } {
    const t = translate;
    const m0 = missionService.get(id);
    if (!m0) return { variant: "error", title: t("common.notifications.mission.not_found") };
    if (m0.status === "expired") return { variant: "error", title: t("mis.collect_expired_title"), description: t("mis.collect_closed_desc") };
    if (m0.status === "completed") return { variant: "error", title: t("mis.collect_completed_title"), description: t("mis.collect_closed_desc") };
    missionService.start(id);
    const m = missionService.get(id)!;
    // สะสมคอยน์แบบมีเป้า (ตาม production: mission_type "coin" + goal > 0): ได้คอยน์ทุกครั้งเข้าคอยน์ของภารกิจ (event_point) เหมือนแบบไม่มีเป้า
    // + นับครั้ง · ครบเป้า = สำเร็จ (ปุ่ม "ภารกิจสำเร็จ" กดไม่ได้) · ยังใช้คอยน์แลกของรางวัลของภารกิจได้
    if (m.type === "coin" && m.target > 0) {
      const n = missionService.addMissionCoins(id);
      const done = missionService.addProgress(id, 1);
      const after = missionService.get(id)!;
      return {
        variant: "success",
        title: t("mis.coin_target_collected", { coins: n }),
        description: done ? t("mis.coin_target_done", { target: after.target, total: after.coin_balance ?? 0 }) : t("mis.coin_target_progress", { progress: after.progress, target: after.target }),
      };
    }
    if (m.type === "coin") {
      const n = missionService.addMissionCoins(id);
      const total = missionService.get(id)?.coin_balance ?? 0;
      return { variant: "success", title: t("mis.coin_collected_result", { coins: n }), description: t("mis.coin_collected_result_desc", { total }) };
    }
    const done = missionService.addProgress(id, 1);
    const after = missionService.get(id)!;
    if (done) {
      sessionActions.addCoins(m.reward_coins, { key: "loyalty.history_mission", params: { name: m.title } });
      return { variant: "success", title: t("core.earned_coins_done", { coins: m.reward_coins }), description: t("common.mission_success_message") };
    }
    return { variant: "success", title: t("core.earned_stamp_done"), description: t("core.progress", { progress: after.progress, target: after.target }) };
  },

  /** เพิ่มความคืบหน้า (เช่น ได้แสตมป์จากใบเสร็จ) — คืน true ถ้าครบเป้าหมายในครั้งนี้ */
  addProgress(id: string, amount = 1): boolean {
    const m = missionService.get(id);
    if (!m || m.status === "completed" || m.status === "expired") return false;
    const progress = Math.min(m.target, m.progress + amount);
    const done = progress >= m.target;
    setState(id, { ...state[id], progress, status: done ? "completed" : "in_progress" });
    persist();
    return done;
  },

  /** ทำภารกิจสำเร็จทันที (เช่น ตอบ quiz ถูกครบ) */
  complete(id: string) {
    const m = missionService.get(id);
    if (!m) return;
    setState(id, { ...state[id], progress: m.target, status: "completed" });
    persist();
  },

  /** ภารกิจสะสมคอยน์: ได้คอยน์เข้าภารกิจ (ลงประวัติคอยน์รวม) — คืนจำนวนที่ได้ */
  addMissionCoins(id: string, amount?: number): number {
    const m = missionService.get(id);
    if (!m || m.type !== "coin" || m.status !== "in_progress") return 0;
    const n = amount ?? m.coins_per_collect ?? 10;
    setState(id, { ...state[id], coin_balance: (m.coin_balance ?? 0) + n });
    persist();
    // เหรียญ C ปลิวไปที่ยอด "คอยน์ของภารกิจนี้" ในหน้าภารกิจ (+ นับขึ้น) — ไม่ใช่หน้าแรก เพราะไม่เข้ายอดคอยน์หลัก
    emitEarned("coins", n, `mission-coins:${id}`);
    sessionActions.logCoins(n, { key: "mis.coin_earned_title", params: { coins: n, mission: m.title } });
    return n;
  },

  /** ภารกิจสะสมคอยน์: สถานะของรางวัลแต่ละชิ้น */
  coinRewardState(m: Mission, rewardId: string, now = Date.now()): "redeemed" | "redeem_expired" | "not_started" | "available" {
    if ((m.redeemed_rewards ?? []).includes(rewardId)) return "redeemed";
    if (m.redeem_end && new Date(`${m.redeem_end}T23:59:59+07:00`).getTime() < now) return "redeem_expired";
    if (m.status === "not_started") return "not_started";
    return "available";
  },

  /** ภารกิจสะสมคอยน์: แลกรางวัลด้วยคอยน์ของภารกิจ */
  redeemCoinReward(id: string, rewardId: string): "ok" | "not_enough" | "unavailable" {
    const m = missionService.get(id);
    const item = m?.coin_rewards?.find((r) => r.reward_id === rewardId);
    if (!m || !item || missionService.coinRewardState(m, rewardId) !== "available") return "unavailable";
    if ((m.coin_balance ?? 0) < item.coins) return "not_enough";
    setState(id, { ...state[id], coin_balance: (m.coin_balance ?? 0) - item.coins, redeemed_rewards: [...(m.redeemed_rewards ?? []), rewardId] });
    persist();
    sessionActions.logCoins(-item.coins, { key: "mis.coin_used_title", params: { coins: item.coins, reward: rewardService.get(rewardId)?.name ?? rewardId } });
    return "ok";
  },

  /** ภารกิจสำเร็จแต่ยังไม่ได้แสดง "ยินดีด้วย" */
  needsCelebration: (id: string) => {
    const m = missionService.get(id);
    return !!m && m.status === "completed" && m.type !== "coin" && !state[id]?.celebrated && !!state[id]?.progress;
  },
  markCelebrated(id: string) {
    setState(id, { ...state[id], celebrated: true });
    persist();
  },

  /** บันทึกว่าแลกรางวัลของภารกิจแล้ว คืนโค้ดที่ได้ */
  redeem(id: string): string {
    const code = missionService.couponCode(id);
    setState(id, { ...state[id], redeemed_code: code });
    persist();
    return code;
  },
};
