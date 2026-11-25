import { Navigate, useParams, useSearchParams } from "@solidjs/router";

/** /:partner/wallet/coupons → คูปองของฉันย้ายไปเป็นแท็บในหน้าแลกรางวัล (/rewards?type=mine) · คง ?tab=history เป็น &status=history */
export default function MyCouponsRedirect() {
  const params = useParams();
  const [search] = useSearchParams<{ tab?: string }>();
  return <Navigate href={`/${params.id}/rewards?type=mine${search.tab === "history" ? "&status=history" : ""}`} />;
}
