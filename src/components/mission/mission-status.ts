import type { Mission } from "~/mocks/missions";
import type { Translate } from "~/lib/i18n";

/**
 * ป้ายสถานะบนการ์ด (ต้นฉบับ: t.track = mission_complete / inprogress / have_not_start → common.<track>)
 * และสีพื้นป้ายตาม track
 */
export function missionTrack(m: Mission): { key: string; class: string } | undefined {
  if (m.status === "completed") return { key: "common.mission_complete", class: "bg-success" };
  if (m.status === "in_progress") return { key: "common.inprogress", class: "bg-secondary" }; // กำลังทำ = ม่วง (เหลืองส้มสงวนให้คอยน์ · DSL 2026-11-28)
  if (m.status === "not_started") return { key: "common.have_not_start", class: "bg-gray" }; // สถานะ = เทา (DSL บทบาทสี 2026-11-28)
  return undefined;
}

/** ข้อความปุ่มหลักของหน้า detail (ต้นฉบับ: helper gi() ใน mission-capability) */
/** ภารกิจสะสมคอยน์แบบมีเป้า (target > 0): ได้คอยน์ทุกครั้งเข้าคอยน์หลัก · ครบเป้า = สำเร็จ (2026-11-25) */
export const isCoinTarget = (m: Mission) => m.type === "coin" && m.target > 0;
/** ภารกิจสะสมคอยน์แบบไม่มีเป้า: คอยน์เข้าภารกิจ (coin_balance) ใช้แลกของรางวัลในภารกิจ */
export const isCoinWallet = (m: Mission) => m.type === "coin" && !(m.target > 0);
/** สะสมครบเป้าแล้ว (ทุกประเภทที่มีเป้า) */
export const missionFull = (m: Mission) => m.target > 0 && m.progress >= m.target;

/** ข้อความ "สะสม…" ในโหมดภารกิจ (หัวหน้าสะสม/ปุ่มส่ง) — ภารกิจใช้คอยน์/แสตมป์ ไม่ใช่ "คะแนน" (คะแนน = ซื้อสินค้าเท่านั้น) */
export const missionCollectKey = (m: Mission) => (m.type === "stamp" ? "mis.collect_stamps" : "mis.collect");

export function missionCtaLabel(m: Mission, t: Translate, checkedInToday = false): string {
  // ภารกิจสะสมคอยน์: เริ่มภารกิจ → "สะสมคอยน์" · หมดเวลา = ปุ่มเทา "สะสมคอยน์" (เดิม Figma ใช้ "สะสมคะแนน" — เปลี่ยน 2026-11-25: ภารกิจใช้คอยน์)
  // ยังไม่เริ่ม → "เริ่มทำภารกิจ" ทุกประเภท (ตัดสินใจ 2026-11-25)
  if (m.status === "not_started") return t("mis.start_mission_all");
  // สะสมคอยน์แบบมีเป้า: ครบแล้ว → "ภารกิจสำเร็จ" (ปุ่มกดไม่ได้)
  if (isCoinTarget(m) && (m.status === "completed" || missionFull(m))) return t("mission.mission_completed");
  if (m.type === "coin") return t("mis.collect");
  switch (m.status) {
    case "in_progress":
      if (m.type === "checkin") return checkedInToday ? t("mis.checked_in_today") : t("mis.checkin_today");
      return m.type === "quiz" ? t("component.tab_slide_dialog.continue_mission") : t("common.earn_coins_from_mission");
    case "completed":
      return m.reward_ids.length ? t("mission.redeem_reward") : t("mission.mission_completed");
    default:
      return t("common.mission_timeout");
  }
}

/** ปลายทางเมื่อกดทำภารกิจ (ต้นฉบับ: point-collection/mission?event_id=..., quiz → quiz-activity/<id>) */
export function missionActionPath(m: Mission): string {
  if (m.type === "quiz") return `missions/${m.id}/quiz`;
  // เช็คอิน: กดที่หน้ารายละเอียดเลย (ไม่ต้องไปหน้าอื่น)
  if (m.type === "checkin") return `missions/${m.id}`;
  return `earn?mission=${m.id}`;
}
