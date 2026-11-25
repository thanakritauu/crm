import { useLocation, useNavigate } from "@solidjs/router";
import { createSignal, For, onCleanup, onMount, Show, type JSX } from "solid-js";
import { LanguageSheet } from "~/components/figma/language-sheet";
import { BalanceBar, BalanceSplit } from "~/components/ui/balance-bar";
import { BottomNav, BottomNavSpacer } from "~/components/layout/bottom-nav";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { AlertDialog } from "~/components/ui/modal";
import { useI18n } from "~/lib/i18n";
import { session, sessionActions } from "~/lib/session";
import { usePartnerPath } from "~/lib/theme";
import { cn } from "~/lib/utils";
import { Toast } from "~/components/ui/toast";
import { tierSystem } from "~/prototype/settings";
import { Avatar } from "~/components/ui/avatar";
import { takeFlash } from "~/lib/navigation";
import { UnreadBadge } from "~/components/layout/notification-bell";
import { IconBell, IconChevronRight, IconCoins, IconCrown, IconHistory, IconLogout, IconMapPin, IconSettings, IconShield, IconSmartphone, IconTicket, IconUser } from "~/components/ui/icons";

/**
 * /:partner/profile — โปรไฟล์ + เมนูบัญชี (มี BottomNav)
 * ต้นฉบับ: index-4238b4cb — แถบสี h-[90px] + รูปโปรไฟล์ 64px + ชื่อ, เมนูเป็นกลุ่ม (หัวกลุ่ม 12px #637381)
 *   แถว: ไอคอน 20px + ชื่อ 16/500 py-[16px] + ลูกศรขวา, เส้นคั่น border-[#EBEBEB]
 *   กลุ่ม "โปรไฟล์": ข้อมูลส่วนตัว, ที่อยู่จัดส่ง (pick-address), แลกคะแนนเป็นคูปอง (exchange-point)
 *   กลุ่ม "การตั้งค่า": เชื่อมต่อแพลตฟอร์มออนไลน์, ภาษา (เปิด dialog เลือกภาษา)
 *   guest → การ์ด bg-secondary-surface "คุณยังไม่ได้เป็นสมาชิก" + ปุ่มสมัครสมาชิก, เมนูกดไม่ได้
 *   กลับมาจากหน้าแก้ไขพร้อม state.status → toast "อัปเดตข้อมูล สำเร็จ" 3 วินาที
 * Figma (871:4783): แถบชมพู 171px + การ์ดคะแนนรวม + เมนู + bottom sheet เลือกภาษา — เก็บเมนู "แลกคะแนนเป็นคูปอง" ของเว็บจริงไว้
 * (เดิม) Prototype: ตัด exchange-point (ยังไม่มีหน้า), เพิ่มกลุ่ม "กิจกรรมของฉัน" (คูปอง/ประวัติคะแนน/ประวัติคอยน์)
 *   และ การตั้งค่า / นโยบาย / ออกจากระบบ (sessionActions.logout → landing) ตาม brief
 *   ที่อยู่จัดส่ง → personal-information/address (แทน pick-address)
 */
type MenuItem = { name: string; icon: () => JSX.Element; path?: string; onClick?: () => void; danger?: boolean; badge?: () => JSX.Element };

/** ไอคอนเมนู 16px — Solar Linear (สี = text-gray ผ่าน currentColor) */
const Icons = {
  user: () => <IconUser size={16} />,
  crown: () => <IconCrown size={16} />,
  bell: () => <IconBell size={16} />,
  pin: () => <IconMapPin size={16} />,
  ticket: () => <IconTicket size={16} />,
  history: () => <IconHistory size={16} />,
  coin: () => <IconCoins size={16} />,
  link: () => <IconSmartphone size={16} />,
  globe: () => <img src={session.language === "en" ? "/images/figma/flag-en.png" : "/images/figma/flag-th.png"} alt="" width="16" height="16" class="rounded-full" />,
  gear: () => <IconSettings size={16} />,
  shield: () => <IconShield size={16} />,
  logout: () => <IconLogout size={16} />,
};

export default function Profile() {
  const { t } = useI18n();
  const to = usePartnerPath();
  const navigate = useNavigate();
  const location = useLocation<{ status?: "success" | "failed"; update?: string }>();
  const [languageOpen, setLanguageOpen] = createSignal(false);
  const [logoutOpen, setLogoutOpen] = createSignal(false);
  const [toast, setToast] = createSignal<{ ok: boolean; text: string }>();

  onMount(() => {
    const sent = takeFlash<{ status?: "success" | "failed"; update?: string }>() ?? location.state;
    const status = sent?.status;
    if (status !== "success" && status !== "failed") return;
    const ok = status === "success";
    const isUpdate = !!sent?.update;
    setToast({
      ok,
      text: t(isUpdate ? (ok ? "profile.update_success" : "profile.update_failed") : ok ? "profile.address_success" : "profile.address_failed"),
    });
    const timer = setTimeout(() => setToast(undefined), 3000);
    onCleanup(() => clearTimeout(timer));
  });

  const isGuest = () => !session.isMember;

  /**
   * เมนู: โปรไฟล์ (ข้อมูลส่วนตัว / ที่อยู่) · กระเป๋าของฉัน (คูปองของฉัน / ประวัติ) · การตั้งค่า (แพลตฟอร์ม / นโยบาย / ภาษา)
   * "แลกคะแนนเป็นคูปอง" ย้ายไปหน้าแลกรางวัล (แท็บคูปอง) เพราะเป็นเรื่องการแลก ไม่ใช่ข้อมูลผู้ใช้
   */
  const groups = (): { group: string; menu: MenuItem[] }[] => [
    {
      group: t("profile.profile_group"),
      menu: [
        { name: t("profile.personal_info"), icon: Icons.user, path: "profile/info" },
        ...(tierSystem() ? [{ name: t("tier.title"), icon: Icons.crown, path: "profile/tier" }] : []),
        { name: t("profile.shipping_address"), icon: Icons.pin, path: "profile/addresses" },
      ],
    },
    {
      group: t("rw.wallet_group"),
      menu: [
        // คูปองของฉัน: แสดงเมื่อเคยแลกคูปองแล้ว → แท็บคูปองของฉันในหน้าแลกรางวัล
        ...(session.myCoupons.length ? [{ name: t("home.my_coupon"), icon: Icons.ticket, path: "rewards?type=mine" }] : []),
        { name: t("rw.history_menu"), icon: Icons.history, path: "wallet/history" },
      ],
    },
    {
      group: t("profile.settings_group"),
      menu: [
        // การแจ้งเตือน (ย้ายจากแถบล่าง) + ป้ายตัวเลขที่ยังไม่อ่าน
        { name: t("notification.title"), icon: Icons.bell, path: "notifications", badge: () => <UnreadBadge /> },
        { name: t("profile.connect_platform"), icon: Icons.link, path: "profile/platforms" },
        { name: t("common.privacy_policy"), icon: Icons.shield, path: "profile/privacy" },
        {
          name: session.language === "en" ? t("profile.language_english") : t("profile.language_thai"),
          icon: Icons.globe,
          onClick: () => setLanguageOpen(true),
        },
      ],
    },
  ];

  const open = (item: MenuItem) => {
    if (isGuest() && !item.danger) return;
    if (item.onClick) return item.onClick();
    if (item.path) navigate(to(item.path), { state: { profile: true } });
  };

  const logout = () => {
    sessionActions.logout();
    navigate(to("welcome"), { replace: true });
  };

  return (
    <div class="min-h-screen bg-white">
      {/* ส่วนหัว (Figma Profile_Member 871:4784): แถบชมพู 171px + รูป 64px + ชื่อ 18/700 สีขาว */}
      <div class="flex h-[171px] w-full flex-col items-center bg-primary pt-6">
        <Avatar size={64} guest={isGuest()} />
        <p class="mt-1 text-18 font-semibold text-white">
          {isGuest() ? t("me.guest_name") : session.customer.name ? `${session.customer.name} ${session.customer.surname}` : session.customer.line_display_name}
        </p>
      </div>

      <div class="mt-[-36px] flex flex-col gap-4 px-4">
        {/* คะแนน | คอยน์ — BalanceSplit เหมือนหน้าแรก (เดิมการ์ดคะแนนอย่างเดียว) */}
        <Show when={!isGuest()} fallback={<BalanceBar unit="points" inline history={false} />}>
          <BalanceSplit />
        </Show>

        {/* ยังไม่เป็นสมาชิก (Figma Profile_Guest 871:4904) */}
        <Show when={isGuest()}>
          <Card class="flex items-center justify-between gap-2 p-4">
            <div class="w-[210px] max-w-[65%]">
              <p class="text-14 font-semibold text-dark">{t("me.guest_title")}</p>
              <p class="mt-1 text-14 text-gray">{t("me.guest_description")}</p>
            </div>
            <Button variant="primary" size="sm" onClick={() => navigate(to("auth/member-check"))}>
              {t("profile.register_button")}
            </Button>
          </Card>
          {/* Guest เปลี่ยนภาษาได้ */}
          <button type="button" onClick={() => setLanguageOpen(true)} class="flex w-full items-center justify-between border-b border-stroke py-4 text-left">
            <span class="flex items-center gap-4">
              <span class="flex size-4 items-center justify-center text-gray">{Icons.globe()}</span>
              <span class="text-16 font-medium text-dark">{session.language === "en" ? t("profile.language_english") : t("profile.language_thai")}</span>
            </span>
            <IconChevronRight size={24} class="text-gray" />
          </button>
        </Show>

        <Show when={!isGuest()}>
          <div class="flex flex-col gap-6">
            <For each={groups()}>
              {(g) => (
                <div class="flex flex-col">
                  <p class="text-12 font-semibold text-gray">{g.group}</p>
                  <For each={g.menu}>
                    {(item) => (
                      <button
                        type="button"
                        onClick={() => open(item)}
                        class="flex w-full items-center justify-between border-b border-stroke py-4 text-left"
                      >
                        <span class="flex items-center gap-4">
                          <span class="flex size-4 items-center justify-center text-gray">{item.icon()}</span>
                          <span class={cn("text-16 font-medium", item.danger ? "text-error" : "text-dark")}>{item.name}</span>
                        </span>
                        <Show when={!item.danger}>
                          <span class="flex items-center gap-2">
                            {item.badge?.()}
                            <IconChevronRight size={24} class="text-gray" />
                          </span>
                        </Show>
                      </button>
                    )}
                  </For>
                </div>
              )}
            </For>
          </div>
        </Show>

        {/* ออกจากระบบ (ทั้งสมาชิกและ Guest) → ยืนยัน → กลับหน้า landing */}
        <button
          type="button"
          onClick={() => setLogoutOpen(true)}
          class="flex w-full items-center gap-4 border-b border-stroke py-4 text-left"
        >
          <span class="flex size-4 items-center justify-center text-error">{Icons.logout()}</span>
          <span class="text-16 font-medium text-error">{t("me.logout_title")}</span>
        </button>
      </div>

      {/* toast (Figma Style=Style4 875:8405): พื้นเขียวอ่อน มุม 16 + วงกลมเขียว 20px + ข้อความ 14/Medium */}
      <Toast text={toast()?.text} tone={toast()?.ok === false ? "error" : "success"} />

      <LanguageSheet open={languageOpen()} onOpenChange={setLanguageOpen} />

      <AlertDialog
        open={logoutOpen()}
        onOpenChange={setLogoutOpen}
        title={t("me.logout_title")}
        description={t("me.logout_description")}
        icon={Icons.logout()}
        cancelText={t("common.cancel")}
        confirmText={t("common.confirm")}
        onConfirm={logout}
      />

      <BottomNavSpacer />
      <BottomNav />
    </div>
  );
}
