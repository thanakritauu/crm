import { A, Navigate, useLocation } from "@solidjs/router";
import { HttpStatusCode } from "@solidjs/start";
import { Show } from "solid-js";
import { buttonVariants } from "~/components/ui/button";
import { useI18n } from "~/lib/i18n";
import { legacyRedirect } from "~/lib/legacy-routes";
import { cn } from "~/lib/utils";

/**
 * หน้าไม่พบ (ข้อความตามหน้า /404 ของต้นฉบับ)
 * - URL เดิมก่อนปรับโครงหน้า (เช่น /charmiss/privilage/detail/p-001) → พาไป URL ใหม่ทันที (lib/legacy-routes)
 * - นอกนั้น: ปุ่มกลับหน้าแรกของแบรนด์ (ส่วนแรกของ path — ไม่มี = charmiss) · ลิงก์สารบัญ prototype เป็นลิงก์รอง
 */
export default function NotFound() {
  const { t } = useI18n();
  const location = useLocation();
  const segments = () => location.pathname.split("/").filter(Boolean);
  const partner = () => segments()[0] || "charmiss";
  const redirect = () => {
    const to = legacyRedirect(segments().slice(1).join("/"), location.search);
    return to ? `/${partner()}/${to}` : null;
  };
  return (
    <Show when={!redirect()} fallback={<Navigate href={redirect()!} />}>
      <main class="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
        <HttpStatusCode code={404} />
        <p class="text-24 font-semibold text-gray-placeholder">404</p>
        <h1 class="mt-4 text-18 font-semibold text-dark">{t("account.not_found_title")}</h1>
        <p class="mt-1 text-14 text-gray">{t("account.not_found_description")}</p>
        {/* ลิงก์หน้าตาปุ่ม primary 48 (ไม่ซ้อน <button> ใน <a>) */}
        <A href={`/${partner()}/home`} class={cn(buttonVariants({ size: "block" }), "mt-8 max-w-xs")}>
          {t("account.back_to_home")}
        </A>
        <A href="/prototype" class="mt-4 min-h-10 text-14 text-gray underline">
          {t("account.back_to_prototype_index")}
        </A>
      </main>
    </Show>
  );
}
