import { Match, Switch } from "solid-js";
import { PlatformIcon } from "~/components/platform/platform-icon";
import type { PlatformConfig } from "~/mocks/platforms";

/**
 * โลโก้แพลตฟอร์มแบบตัวอักษร สูง 30px (Figma Connect_SelectPlatform: Shopee / Lazada / TikTokShop)
 * LINE Shopping → โลโก้ตัวอักษร "LINE SHOPPING" สีเขียว (ไฟล์จากเจ้าของ Asset 1@3x.png ย่อเป็น 480px) แสดง 160 × 16px (ไม่ชนป้าย x10 มุมขวา)
 */
export function PlatformLogo(props: { platform: PlatformConfig }) {
  // ชิ้นส่วนโลโก้ Lazada ตามตำแหน่ง inset ใน Figma (node 10:711)
  const laz = [
    { f: "g35", i: "20.12% 52.96% 38.56% 40.87%" },
    { f: "g41", i: "30.47% 42.53% 37.88% 47.65%" },
    { f: "g47", i: "31.09% 33% 38.5% 59.12%" },
    { f: "g53", i: "30.47% 22.44% 37.88% 67.74%" },
    { f: "g59", i: "17.67% 11.22% 37.88% 78.96%" },
    { f: "g65", i: "30.47% 0 37.88% 90.18%" },
    { f: "g71", i: "8.51% 67.73% 8.51% 0.01%" },
    { f: "g79", i: "22.12% 67.72% 8.51% 16.08%" },
  ];
  return (
    <Switch
      fallback={
        <div class="flex h-[30px] items-center gap-2">
          <div class="h-[30px] w-[30px]">
            <PlatformIcon platform={props.platform} />
          </div>
          <span class="text-16 font-semibold text-dark">{props.platform.display_name}</span>
        </div>
      }
    >
      <Match when={props.platform.platform === "line"}>
        <img src="/images/figma/logo-line-shopping.png" alt="LINE Shopping" width="160" height="16" class="h-4 w-[160px]" />
      </Match>
      <Match when={props.platform.platform === "shopee"}>
        <img src="/images/figma/logo-shopee.svg" alt="Shopee" class="h-[30px] w-[93.904px]" />
      </Match>
      <Match when={props.platform.platform === "tiktok"}>
        <div class="relative h-[30px] w-[123px] overflow-hidden" role="img" aria-label="TikTok">
          <img src="/images/figma/logo-tiktokshop.svg" alt="" class="absolute" style={{ inset: "14.95% 36.92% 19.89% 0.3%" }} />
        </div>
      </Match>
      <Match when={props.platform.platform === "lazada"}>
        <div class="relative h-[30px] w-[95px]" role="img" aria-label="Lazada">
          {laz.map((p) => (
            <img src={`/images/figma/laz-${p.f}.svg`} alt="" class="absolute block" style={{ inset: p.i }} />
          ))}
          <img src="/images/figma/laz-g970.svg" alt="" class="absolute block -scale-x-100" style={{ inset: "22.36% 83.98% 9.01% 0" }} />
        </div>
      </Match>
    </Switch>
  );
}
