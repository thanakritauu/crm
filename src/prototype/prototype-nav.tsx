import { A, useLocation } from "@solidjs/router";
import { createSignal, For, onMount, Show } from "solid-js";
import { applyFrameMode } from "~/components/layout/mobile-frame";
import { outsideLine, pointsExpire, restorePrototypeSettings, setOutsideLine, setPointsExpire, setShowTierCard, setShowWelcome, showTierCard, showWelcome, homeDark, setHomeDark, homeBalance, setHomeBalance } from "./settings";
import { Dialog as DialogPrimitive } from "@kobalte/core/dialog";
import { resetSession, session, sessionActions } from "~/lib/session";
import { customer as mockCustomer } from "~/mocks/customer";

/** รูปโปรไฟล์ตั้งต้นของผู้ใช้จำลอง (ใช้ตอนปิดสวิตช์ "ไม่มีรูปโปรไฟล์") */
const DEFAULT_PHOTO = mockCustomer.profile_image;
import { platformStoreActions } from "~/mocks/platforms";
import { resetExchangeState } from "~/services/history-service";
import { earnService } from "~/services/earn-service";
import { addressService } from "~/services/address-service";
import { missionService } from "~/services/mission-service";
import { usePartnerPath } from "~/lib/theme";
import { cn } from "~/lib/utils";
import { screenGroups } from "./screens";
import { resetWelcome } from "~/components/home/welcome-popup";
import { resetRefreshCooldown } from "~/components/platform/platform-refresh-button";

/**
 * เมนู prototype — ปุ่มลอยมุมขวาล่าง เปิด sheet รายการหน้าทั้งหมด
 * มีเฉพาะใน prototype ไม่ใช่ส่วนของแอปจริง (ลบได้เมื่อนำไปใช้)
 */
export function PrototypeNav() {
  const [open, setOpen] = createSignal(false);
  const [frame, setFrame] = createSignal<"mobile" | "full">("full");
  onMount(() => {
    setFrame(applyFrameMode());
    restorePrototypeSettings();
  });
  const to = usePartnerPath();
  const location = useLocation();
  return (
    <DialogPrimitive open={open()} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        class="fixed bottom-[112px] right-3 z-fab flex h-11 w-11 items-center justify-center rounded-full bg-dark/90 text-white shadow-card ring-2 ring-white transition hover:scale-105"
        aria-label="เมนู prototype"
      >
        <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay class="fixed inset-0 z-devtools bg-black/50 data-[expanded]:animate-in data-[expanded]:fade-in-0" />
        <DialogPrimitive.Content class="fixed-frame bottom-0 z-devtools max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white p-4 pb-8 data-[expanded]:animate-in data-[expanded]:slide-in-from-bottom">
          <div class="mx-auto mb-2 h-1 w-10 rounded-full bg-surface-gray" />
          <div class="mb-2 flex items-center justify-between">
            <DialogPrimitive.Title class="text-18 font-semibold text-dark">หน้าทั้งหมดใน prototype</DialogPrimitive.Title>
            <A href="/prototype" class="text-14 font-semibold text-primary" onClick={() => setOpen(false)}>
              หน้ารวม
            </A>
          </div>
          <For each={screenGroups}>
            {(group) => (
              <div class="mb-4">
                <h3 class="mb-1 text-12 font-semibold text-gray">{group.title}</h3>
                <For each={group.screens}>
                  {(s) => (
                    <A
                      href={to(s.path)}
                      onClick={() => setOpen(false)}
                      class={cn(
                        "flex items-center justify-between rounded-xl px-4 py-2 text-14",
                        location.pathname === to(s.path) ? "bg-primary-surface text-primary" : "hover:bg-surface-gray",
                      )}
                    >
                      <span>{s.title}</span>
                      <Show when={s.status !== "done"}>
                        <span class="text-12 text-gray-placeholder">ยังไม่ทำ</span>
                      </Show>
                    </A>
                  )}
                </For>
              </div>
            )}
          </For>
          <A href="/styleguide" onClick={() => setOpen(false)} class="block rounded-xl px-4 py-2 text-14 text-secondary hover:bg-surface-gray">
            Style guide
          </A>
          <A href="/docs" onClick={() => setOpen(false)} class="block rounded-xl px-4 py-2 text-14 text-secondary hover:bg-surface-gray">
            เอกสาร (README, design system, สรุปการเปลี่ยนแปลง)
          </A>
          <A href="/qr" onClick={() => setOpen(false)} class="block rounded-xl px-4 py-2 text-14 text-secondary hover:bg-surface-gray">
            QR ตัวอย่าง (ทดสอบแสกนคิวอาร์โค้ด)
          </A>
          <button
            type="button"
            class="mt-1 flex w-full items-center justify-between rounded-xl px-4 py-2 text-left text-14 text-dark hover:bg-surface-gray"
            onClick={() => setFrame(applyFrameMode(frame() === "mobile" ? "full" : "mobile"))}
          >
            <span>แสดงในกรอบมือถือ (สำหรับนำเสนอบนจอคอม)</span>
            <ToggleSwitch on={frame() === "mobile"} />
          </button>
          <button
            type="button"
            class="mt-1 flex w-full items-center justify-between rounded-xl px-4 py-2 text-left text-14 text-dark hover:bg-surface-gray"
            onClick={() => setPointsExpire(!pointsExpire())}
          >
            <span>คะแนนมีวันหมดอายุ (หน้าประวัติคะแนนแสดงแท็บ "หมดอายุ")</span>
            <ToggleSwitch on={pointsExpire()} />
          </button>
          <button
            type="button"
            class="mt-1 flex w-full items-center justify-between rounded-xl px-4 py-2 text-left text-14 text-dark hover:bg-surface-gray"
            onClick={() => setOutsideLine(!outsideLine())}
          >
            <span>จำลองเปิดนอก LINE (หน้าเข้าสู่ระบบมีปุ่ม "เบอร์มือถือ")</span>
            <ToggleSwitch on={outsideLine()} />
          </button>
          <button
            type="button"
            class="mt-1 flex w-full items-center justify-between rounded-xl px-4 py-2 text-left text-14 text-dark hover:bg-surface-gray"
            onClick={() => setShowTierCard(!showTierCard())}
          >
            <span>แสดงการ์ด "ระดับของคุณ" ในหน้าแรก</span>
            <ToggleSwitch on={showTierCard()} />
          </button>
          <button
            type="button"
            class="mt-1 flex w-full items-center justify-between rounded-xl px-4 py-2 text-left text-14 text-dark hover:bg-surface-gray"
            onClick={() => {
              const on = !showWelcome();
              setShowWelcome(on);
              // เปิด → ล้าง "ไม่ต้องแสดงอีก"/เห็นแล้ว ให้ขึ้นตอนเปิดหน้าแรกครั้งถัดไป
              if (on) resetWelcome();
            }}
          >
            <span>แสดง popup ต้อนรับเมื่อเปิดหน้าแรก</span>
            <ToggleSwitch on={showWelcome()} />
          </button>
          <button
            type="button"
            class="mt-1 flex w-full items-center justify-between rounded-xl px-4 py-2 text-left text-14 text-dark hover:bg-surface-gray"
            onClick={() => setHomeDark(!homeDark())}
          >
            <span>หน้าแรกพื้นหลังชมพูเข้ม + การ์ดสีขาว (ปิด = พื้นชมพูอ่อน + การ์ดชมพูเข้ม)</span>
            <ToggleSwitch on={homeDark()} />
          </button>
          <button
            type="button"
            class="mt-1 flex w-full items-center justify-between rounded-xl px-4 py-2 text-left text-14 text-dark hover:bg-surface-gray"
            onClick={() => sessionActions.updateCustomer({ profile_image: session.customer.profile_image ? "" : DEFAULT_PHOTO })}
          >
            <span>ผู้ใช้ไม่มีรูปโปรไฟล์ (หน้าแรก / โปรไฟล์แสดงไอคอนผู้ใช้แทน)</span>
            <ToggleSwitch on={!session.customer.profile_image} />
          </button>
          {/* การ์ดยอดหน้าแรก: ทั้งคู่ / คะแนน / คอยน์ (2026-11-26) */}
          <div class="mt-1 rounded-xl px-4 py-2">
            <p class="text-14 text-dark">การ์ดยอดหน้าแรก</p>
            <div class="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ["both", "คะแนน + คอยน์"],
                  ["points", "คะแนนอย่างเดียว"],
                  ["coins", "คอยน์อย่างเดียว"],
                ] as const
              ).map(([value, label]) => (
                <button
                  type="button"
                  class={cn(
                    "rounded-full border px-4 py-1 text-12 font-medium",
                    homeBalance() === value ? "border-primary bg-primary text-white" : "border-stroke-strong text-dark hover:border-primary hover:text-primary",
                  )}
                  onClick={() => setHomeBalance(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div class="mt-1 rounded-xl px-4 py-2">
            <p class="text-14 text-dark">คูปองของฉัน (ดู 3 สถานะในหน้าแรก)</p>
            <div class="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ["has", "มีคูปองพร้อมใช้"],
                  ["all_used", "ใช้หมดแล้ว"],
                  ["none", "ยังไม่เคยมี"],
                ] as const
              ).map(([value, label]) => (
                <button
                  type="button"
                  class="rounded-full border border-stroke-strong px-4 py-1 text-12 font-medium text-dark hover:border-primary hover:text-primary"
                  onClick={() => sessionActions.setCouponScenario(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div class="mt-1 rounded-xl px-4 py-2">
            <p class="text-14 text-dark">การแจ้งเตือน</p>
            <div class="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ["เพิ่มตัวอย่าง (ยังไม่อ่าน)", () =>
                    sessionActions.pushNotification({ key: "delivered", params: { name: "Glow Setting Powder Translucent" }, type: "redeem", icon: "gift", link: "rewards" })],
                  ["ล้างทั้งหมด", () => sessionActions.setNotifications("empty")],
                  ["ชุดตั้งต้น", () => sessionActions.setNotifications("seed")],
                ] as const
              ).map(([label, run]) => (
                <button
                  type="button"
                  class="rounded-full border border-stroke-strong px-4 py-1 text-12 font-medium text-dark hover:border-primary hover:text-primary"
                  onClick={run}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            class="mt-1 block w-full rounded-xl px-4 py-2 text-left text-14 text-gray hover:bg-surface-gray"
            onClick={() => {
              resetSession();
              resetRefreshCooldown();
              resetExchangeState();
              platformStoreActions.reset();
              missionService.reset();
              earnService.reset();
              addressService.reset();
              setOpen(false);
            }}
          >
            รีเซ็ตข้อมูลจำลอง (คะแนน, คูปอง, ประวัติ, QR ที่ใช้แล้ว)
          </button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive>
  );
}


/**
 * สวิตช์เปิด/ปิดในเมนู prototype — ราง 44×24 · ปุ่มกลม 16 (ขอบใน 4px ทุกด้าน) · เปิด = เลื่อน 20px พื้นชมพู
 * (เดิมราง 20px แต่ padding 4 + ปุ่ม 16 = 24 → ปุ่มล้นรางดูเบี้ยว — แก้ 2026-11-26)
 */
function ToggleSwitch(props: { on: boolean }) {
  return (
    <span class={cn("flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition-colors", props.on ? "bg-primary" : "bg-stroke-strong")} aria-hidden="true">
      <span class={cn("block size-4 rounded-full bg-white shadow-card transition-transform", props.on && "translate-x-5")} />
    </span>
  );
}
