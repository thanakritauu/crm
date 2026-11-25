import { Navigate, useParams } from "@solidjs/router";

/** /charmiss → /charmiss/welcome (ผู้ใช้ที่ยังไม่ล็อกอิน — เหมือนต้นฉบับ) */
export default function PartnerIndex() {
  const params = useParams();
  return <Navigate href={`/${params.id}/welcome`} />;
}
