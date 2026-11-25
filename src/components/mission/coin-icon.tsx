/**
 * ไอคอนคอยน์ "C" (ไฟล์ของแบรนด์ public/images/icons/coin.png 48×48) — ใช้คู่กับไอคอนคะแนน "P" (theme image_point = /images/icons/point.png)
 * size = ความกว้าง/สูงเป็น px (ค่าเริ่มต้น 16)
 */
export function CoinIcon(props: { size?: number; class?: string }) {
  const s = () => props.size ?? 16;
  return <img src="/images/icons/coin.png" alt="" width={s()} height={s()} class={props.class} style={{ width: `${s()}px`, height: `${s()}px` }} aria-hidden="true" />;
}
