import { Navigate } from "@solidjs/router";

/** /docs → เปิด README ก่อน */
export default function DocsIndex() {
  return <Navigate href="/docs/readme" />;
}
