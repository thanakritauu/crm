import { A } from "@solidjs/router";
import { Show } from "solid-js";
import { useI18n } from "~/lib/i18n";
import type { Coupon } from "~/mocks/coupons";
import { CouponDefaultCover } from "~/components/coupon/coupon-default-cover";

/**
 * การ์ดคูปอง (Figma My Coupon 583:1753)
 * รูป h-[160px] rounded-t-2xl · drop-shadow-card (ทรงมีรอยเว้า) · เส้นประด้านบนส่วนชื่อ · ชื่อ 14/600 Text/Black สูงสุด 2 บรรทัด เกินตัด … (สูง 2 บรรทัดเสมอ การ์ดจึงเท่ากัน)
 * รอยเว้า 2 ข้างตรงรอยต่อ (Subtract 8x16) · ใช้แล้ว/หมดอายุ: ทับรูปด้วยแถบมืด + ข้อความ
 */
export function FigmaCouponCard(props: { coupon: Coupon; href: string }) {
  const { t } = useI18n();
  const c = () => props.coupon;
  const overlay = () => (c().status === "used" ? t("common.expired_use_overlay") : c().status === "expired" ? t("core.coupon_expired") : "");
  return (
    <A href={props.href} class="relative block min-w-0">
      <div class="drop-shadow-card">
        <div class="relative aspect-square overflow-hidden rounded-t-2xl bg-white">
          {/* ไม่มีรูป = ภาพปกเริ่มต้นของระบบ (ไอคอนตั๋ว + มูลค่าส่วนลด · 2026-11-27) */}
          <Show when={c().image} fallback={<CouponDefaultCover discount={c().discount} class="h-full w-full" />}>
            <img src={c().image} alt="" class="h-full w-full object-cover" />
          </Show>
          <Show when={overlay()}>
            <div class="absolute inset-0 flex items-center justify-center bg-black/50">
              <span class="text-14 font-semibold text-white">{overlay()}</span>
            </div>
          </Show>
        </div>
        <div class="relative rounded-b-2xl border-t border-dashed border-stroke bg-white p-2">
          {/* รอยบากซ้าย/ขวาที่เส้นประ — อิงขอบบนของส่วนข้อความ (รูปเป็น 1:1 ความสูงจึงเปลี่ยนตามความกว้าง) */}
          <img src="/images/figma/notch-left.svg" alt="" width="16" height="8" class="absolute left-[-4px] top-[-4px] -rotate-90" />
          <img src="/images/figma/notch-left.svg" alt="" width="16" height="8" class="absolute right-[-4px] top-[-4px] rotate-90" />
          <p class="line-clamp-2 h-[2lh] break-words text-left text-14 font-semibold text-dark">{c().title}</p>
        </div>
      </div>
    </A>
  );
}
