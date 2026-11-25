import { useLocation, useNavigate } from "@solidjs/router";
import { For } from "solid-js";
import { Dynamic } from "solid-js/web";
import { useI18n } from "~/lib/i18n";
import { useTheme } from "~/lib/theme";
import { cn } from "~/lib/utils";
import { IconGift, IconHome, IconMission, IconUser } from "~/components/ui/icons";

/**
 * NavBottom — ตาม Figma "Nav" (component 2022:*)
 * พื้นขาว drop-shadow-card (ให้เงาตามปุ่มกลางที่ยกขึ้น) pb-8 · ช่องละ 60px · ไอคอน 16px + ข้อความ 12/400
 * active: ไอคอนชมพู (+พื้นชมพูอ่อน) และตัวอักษร text-primary, ปกติ text-dark
 * ช่องกลาง "สะสมคะแนน": ไอคอน EarnPoint 48px ยกขึ้น (top -24px)
 * เรียง: หน้าแรก · แลกรางวัล (คะแนน) · [สะสมคะแนน] · ภารกิจ (คอยน์) · โปรไฟล์ — ฝั่งซ้ายเรื่องคะแนน ฝั่งขวาเรื่องคอยน์
 * (เดิมช่องที่ 4 = แจ้งเตือน → ย้ายเป็นกระดิ่งมุมขวาบนหน้าแรก + แถวในโปรไฟล์ — NotificationBell)
 * ไอคอน: Solar Linear (Home / Gift / CupStar / User) · active = สีชมพู · ปุ่มกลางยังเป็นไอคอนสะสมคะแนนของแบรนด์
 */
const ITEMS: { path: string; key: string; icon?: typeof IconHome }[] = [
  { path: "home", key: "component.nav_bottom.home", icon: IconHome },
  { path: "rewards", key: "rw.title", icon: IconGift },
  { path: "earn", key: "component.nav_bottom.collect_points" },
  { path: "missions", key: "mission.mission", icon: IconMission },
  { path: "profile", key: "component.nav_bottom.profile", icon: IconUser },
];

export function BottomNav() {
  const { t } = useI18n();
  const { partner } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname.startsWith(`/${partner()}/${path}`);

  return (
    <nav class="fixed-frame bottom-0 z-bar bg-white px-2 pb-8 drop-shadow-card">
      {/* 5 ช่องกว้างเท่ากัน (grid) — ระยะห่างเท่ากันทุกขนาดจอ */}
      <div class="relative mx-auto grid max-w-mobile grid-cols-5 items-end">
        <For each={ITEMS}>
          {(item) =>
            item.icon ? (
              <button
                type="button"
                onClick={() => navigate(`/${partner()}/${item.path}`)}
                class="flex min-w-0 flex-col items-center justify-end gap-2 pb-1 pt-2"
              >
                <span class="relative flex">
                  <Dynamic component={item.icon} size={16} class={isActive(item.path) ? "text-primary" : "text-dark"} />
                </span>
                <span class={cn("whitespace-nowrap text-12 font-medium", isActive(item.path) ? "text-primary" : "text-dark")}>{t(item.key)}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate(`/${partner()}/${item.path}`)}
                class="group relative flex h-[54px] min-w-0 flex-col items-center"
              >
                <span class="absolute top-[-24px] flex flex-col items-center gap-2">
                  {/* ไอคอน P (ไฟล์ของแบรนด์) + ขอบขาว/เงาให้ดูยกขึ้นเหมือนเดิม */}
                  <img src="/images/icons/point.png" alt="" width="48" height="48" class="size-12 rounded-full border-[3px] border-white shadow-card transition group-active:scale-95" />
                  <span class={cn("whitespace-nowrap text-12 font-medium", isActive(item.path) ? "text-primary" : "text-dark")}>{t(item.key)}</span>
                </span>
              </button>
            )
          }
        </For>
      </div>
    </nav>
  );
}

/** เว้นที่ให้ BottomNav */
export const BottomNavSpacer = () => <div class="h-[100px]" aria-hidden="true" />;
