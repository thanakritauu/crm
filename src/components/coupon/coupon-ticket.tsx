import type { JSX } from "solid-js";
import { CoverImage } from "~/components/ui/cover-image";
import type { Coupon } from "~/mocks/coupons";
import { formatDate } from "~/lib/utils";
import { useI18n } from "~/lib/i18n";

/** ทรงตั๋วเว้าครึ่งวงกลมซ้าย/ขวากึ่งกลางความสูง (เทียบเท่า SVG path ใน coupon/index-*.js ของต้นฉบับ) */
const ticketMask = "radial-gradient(circle at left center, transparent 16px, black 16.5px) left / 51% 100% no-repeat, radial-gradient(circle at right center, transparent 16px, black 16.5px) right / 51% 100% no-repeat";
const ticketStyle: JSX.CSSProperties = { "-webkit-mask": ticketMask, mask: ticketMask };

/**
 * คูปองแนวนอนในหน้า /coupon (ต้นฉบับ: h-[110px], รูปกลม w-16, เส้นประแนวตั้ง, หัวข้อ 24/600, คำอธิบาย 16/500, "Valid until")
 * เพิ่มเติมจากต้นฉบับ: ส่วนท้าย (footer) แสดงคะแนนที่ใช้แลก
 */
export function CouponTicket(props: { coupon: Coupon; footer?: JSX.Element; onClick?: () => void }) {
  const { t } = useI18n();
  const c = () => props.coupon;
  return (
    <div class="relative w-full max-w-[400px] cursor-pointer drop-shadow-card" onClick={props.onClick} role="button" tabIndex={0}>
      <div class="flex min-h-[110px] w-full items-center rounded-lg bg-surface-gray p-4" style={ticketStyle}>
        <div class="mx-2 size-16 shrink-0 overflow-hidden rounded-full">
          <CoverImage colors={c().cover} src={c().image} class="size-16" />
        </div>
        <div class="flex w-1 justify-center self-stretch">
          <div class="h-full border-l-2 border-dashed border-gray/20" />
        </div>
        <div class="flex min-w-0 flex-1 flex-col justify-center pl-4">
          <span class="text-24 font-semibold text-dark">{c().discount}</span>
          <span class="line-clamp-2 break-words text-16 font-semibold text-dark">{c().title}</span>
          <span class="mt-1 line-clamp-1 text-12 font-normal text-gray">{t("loyalty.valid_until", { date: formatDate(c().expires_at) })}</span>
          {props.footer}
        </div>
      </div>
    </div>
  );
}
