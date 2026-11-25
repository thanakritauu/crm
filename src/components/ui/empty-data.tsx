import { translate } from "~/lib/i18n";

/** สถานะไม่มีข้อมูล (Figma "Nodata"): รูป 100px + ข้อความ 14/Semi + คำอธิบาย 12/Reg สีเทา */
export function EmptyData(props: { title?: string; description?: string; class?: string }) {
  return (
    <div class={`flex flex-col items-center py-8 text-center ${props.class ?? ""}`}>
      <img src="/images/empty-image.png" class="size-[100px]" alt="" />
      <h2 class="text-14 font-semibold text-dark">{props.title ?? translate("profile.no_data_found")}</h2>
      {props.description && <p class="mt-1 text-12 text-gray">{props.description}</p>}
    </div>
  );
}
