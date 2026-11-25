import { A, useLocation } from "@solidjs/router";
import { createSignal, For, onMount, Show } from "solid-js";
import { applyFrameMode } from "~/components/layout/mobile-frame";
import { outsideLine, pointsExpire, restorePrototypeSettings, setOutsideLine, setPointsExpire, setShowTierCard, setShowWelcome, setTierSystem, showTierCard, showWelcome, tierSystem } from "./settings";
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
            <span class={cn("h-5 w-9 rounded-full p-1 transition", frame() === "mobile" ? "bg-primary" : "bg-stroke-strong")}>
              <span class={cn("block h-4 w-4 rounded-full bg-white transition", frame() === "mobile" && "translate-x-4")} />
            </span>
          </button>
          <button
            type="button"
            class="mt-1 flex w-full items-center justify-between rounded-xl px-4 py-2 text-left text-14 text-dark hover:bg-surface-gray"
            onClick={() => setPointsExpire(!pointsExpire())}
          >
            <span>คะแนนมีวันหมดอายุ (หน้าประวัติคะแนนแสดงแท็บ "หมดอายุ")</span>
            <span class={cn("h-5 w-9 shrink-0 rounded-full p-1 transition", pointsExpire() ? "bg-primary" : "bg-stroke-strong")}>
              <span class={cn("block h-4 w-4 rounded-full bg-white transition", pointsExpire() && "translate-x-4")} />
            </span>
          </button>
          <button
            type="button"
            class="mt-1 flex w-full items-center justify-between rounded-xl px-4 py-2 text-left text-14 text-dark hover:bg-surface-gray"
            onClick={() => setOutsideLine(!outsideLine())}
          >
            <span>จำลองเปิดนอก LINE (หน้าเข้าสู่ระบบมีปุ่ม "เบอร์มือถือ")</span>
            <span class={cn("h-5 w-9 shrink-0 rounded-full p-1 transition", outsideLine() ? "bg-primary" : "bg-stroke-strong")}>
              <span class={cn("block h-4 w-4 rounded-full bg-white transition", outsideLine() && "translate-x-4")} />
            </span>
          </button>
          <button
            type="button"
            class="mt-1 flex w-full items-center justify-between rounded-xl px-4 py-2 text-left text-14 text-dark hover:bg-surface-gray"
            onClick={() => setTierSystem(!tierSystem())}
          >
            <span>มีระบบระดับสมาชิก (ปิด = ไม่มีระดับเลย)</span>
            <span class={cn("h-5 w-9 shrink-0 rounded-full p-1 transition", tierSystem() ? "bg-primary" : "bg-stroke-strong")}>
              <span class={cn("block h-4 w-4 rounded-full bg-white transition", tierSystem() && "translate-x-4")} />
            </span>
          </button>
          <button
            type="button"
            class="mt-1 flex w-full items-center justify-between rounded-xl px-4 py-2 text-left text-14 text-dark hover:bg-surface-gray"
            onClick={() => setShowTierCard(!showTierCard())}
          >
            <span>แสดงการ์ด "ระดับของคุณ" ในหน้าแรก</span>
            <span class={cn("h-5 w-9 shrink-0 rounded-full p-1 transition", showTierCard() ? "bg-primary" : "bg-stroke-strong")}>
              <span class={cn("block h-4 w-4 rounded-full bg-white transition", showTierCard() && "translate-x-4")} />
            </span>
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
            <span class={cn("h-5 w-9 shrink-0 rounded-full p-1 transition", showWelcome() ? "bg-primary" : "bg-stroke-strong")}>
              <span class={cn("block h-4 w-4 rounded-full bg-white transition", showWelcome() && "translate-x-4")} />
            </span>
          </button>
          <button
            type="button"
            class="mt-1 flex w-full items-center justify-between rounded-xl px-4 py-2 text-left text-14 text-dark hover:bg-surface-gray"
            onClick={() => sessionActions.updateCustomer({ profile_image: session.customer.profile_image ? "" : DEFAULT_PHOTO })}
          >
            <span>ผู้ใช้ไม่มีรูปโปรไฟล์ (หน้าแรก / โปรไฟล์แสดงไอคอนผู้ใช้แทน)</span>
            <span class={cn("h-5 w-9 shrink-0 rounded-full p-1 transition", !session.customer.profile_image ? "bg-primary" : "bg-stroke-strong")}>
              <span class={cn("block h-4 w-4 rounded-full bg-white transition", !session.customer.profile_image && "translate-x-4")} />
            </span>
          </button>
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
