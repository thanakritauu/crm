import { A, useSearchParams } from "@solidjs/router";
import { For, Show } from "solid-js";
import { FigmaCouponCard } from "~/components/figma/coupon-card";
import { Button } from "~/components/ui/button";
import { EmptyData } from "~/components/ui/empty-data";
import { useI18n } from "~/lib/i18n";
import { session } from "~/lib/session";
import { usePartnerPath } from "~/lib/theme";
import { cn } from "~/lib/utils";

/**
 * แท็บ "คูปองของฉัน" ในหน้าแลกรางวัล (/rewards?type=mine) — เดิมหน้า /wallet/coupons แยก และส่วนหนึ่งในหน้าแรก
 * แสดงแท็บนี้เมื่อเคยแลกคูปองแล้วเท่านั้น (session.myCoupons ไม่ว่าง) · ชิป พร้อมใช้งาน / ใช้งานแล้ว-หมดอายุ (&status=history)
 * การ์ดคูปอง 2 คอลัมน์ → /wallet/coupons/:id
 */
export function MyCoupons() {
  const { t } = useI18n();
  const to = usePartnerPath();
  const [params, setParams] = useSearchParams<{ status?: string }>();
  const status = () => (params.status === "history" ? "history" : "ready");
  const list = () => session.myCoupons.filter((c) => (status() === "ready" ? c.status === "available" : c.status !== "available"));
  const chips = () => [
    { value: "ready", label: t("common.ready_to_use") },
    { value: "history", label: t("common.used_expired") },
  ];
  return (
    <div class="flex flex-col gap-4 p-4">
      <div class="flex gap-2">
        <For each={chips()}>
          {(c) => (
            <Button
              size="chip"
              variant={status() === c.value ? "primary" : "outline"}
              class={cn(status() !== c.value && "border-stroke text-gray")}
              onClick={() => setParams({ status: c.value === "ready" ? undefined : c.value }, { replace: true })}
            >
              {c.label}
            </Button>
          )}
        </For>
      </div>
      <Show
        when={list().length}
        fallback={
          <div class="flex flex-col items-center gap-4 pt-12">
            <EmptyData title={t("core.no_coupons_yet")} />
            <A href={to("rewards?type=coupons")} class="text-14 font-medium text-primary underline">
              {t("core.redeem_coupon_cta")}
            </A>
          </div>
        }
      >
        <div class="grid grid-cols-2 gap-4">
          <For each={list()}>{(c) => <FigmaCouponCard coupon={c} href={to(`wallet/coupons/${c.id}`)} />}</For>
        </div>
      </Show>
    </div>
  );
}
