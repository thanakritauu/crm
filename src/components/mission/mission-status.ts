import type { Mission } from "~/mocks/missions";
import type { Translate } from "~/lib/i18n";

/**
 * ป้ายสถานะบนการ์ด (ต้นฉบับ: t.track = mission_complete / inprogress / have_not_start → common.<track>)
 * และสีพื้นป้ายตาม track
 */
export function missionTrack(m: Mission): { key: string; class: string } | undefined {
  if (m.status === "completed") return { key: "common.mission_complete", class: "bg-success" };
  if (m.status === "in_progress") return { key: "common.inprogress", class: "bg-warning" };
  if (m.status === "not_started") return { key: "common.have_not_start", class: "bg-secondary" };
  return undefined;
}

/** ข้อความปุ่มหลักของหน้า detail (ต้นฉบับ: helper gi() ใน mission-capability) */
export function missionCtaLabel(m: Mission, t: Translate, checkedInToday = false): string {
  // ภารกิจสะสมคอยน์ (Figma): เริ่มภารกิจ → สะสมคะแนน · หมดเวลา = ปุ่มเทา "สะสมคะแนน"
  if (m.type === "coin") return m.status === "not_started" ? t("mis.start") : t("mis.collect");
  switch (m.status) {
    case "not_started":
      return m.type === "stamp" ? t("common.start_collecting_stamp") : t("mission.start_mission");
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
