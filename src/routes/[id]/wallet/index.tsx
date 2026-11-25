import { Navigate, useParams } from "@solidjs/router";

/** /:partner/wallet → คูปองของฉัน (หน้าแรกของกระเป๋า) */
export default function WalletIndex() {
  const params = useParams();
  return <Navigate href={`/${params.id}/rewards?type=mine`} />;
}
