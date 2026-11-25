import { Navigate } from "@solidjs/router";

/** เปิดเว็บแล้วเจอหน้าเข้าสู่ระบบก่อน (หน้ารวม prototype อยู่ที่ /prototype) */
export default function Root() {
  return <Navigate href="/charmiss/landing" />;
}
