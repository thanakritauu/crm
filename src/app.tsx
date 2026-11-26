import { MetaProvider, Title } from "@solidjs/meta";
import { Router, useLocation } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { onCleanup, onMount, Show, Suspense } from "solid-js";
import { applyFrameMode, MobileFrame } from "~/components/layout/mobile-frame";
import { I18nProvider } from "~/lib/i18n";
import { restoreSession } from "~/lib/session";
import { restorePlatformState } from "~/mocks/platforms";
import { markEntryDepth } from "~/lib/navigation";
import { missionService } from "~/services/mission-service";
import { notificationService } from "~/services/notification-service";
import { ThemeProvider } from "~/lib/theme";
import { PrototypeNav } from "~/prototype/prototype-nav";
import { MemberGateModal } from "~/lib/member-gate";
import { FlyToHome } from "~/components/layout/fly-to-home";
import "./app.css";

/** หน้าที่ไม่อยู่ในกรอบมือถือ (เครื่องมือของ prototype) */
const isToolPage = (path: string) => ["/prototype", "/styleguide", "/docs", "/qr"].some((p) => path === p || path.startsWith(`${p}/`));

function Shell(props: { children: any }) {
  const location = useLocation();
  onMount(() => {
    // จำตำแหน่งหน้าแรกที่เปิดแอป → ปุ่ม < รู้ว่ามีหน้าก่อนหน้าในแอปหรือไม่
    markEntryDepth();
    applyFrameMode();
    restoreSession();
    // สถานะการเชื่อมต่อแพลตฟอร์ม — ทางลัดหน้าแรก (ป้ายเขียวจำนวนที่เชื่อมแล้ว) ต้องรู้ตั้งแต่เปิดแอป ไม่ใช่แค่ตอนเข้าหน้าเชื่อมต่อ
    restorePlatformState();
    missionService.restore();
    // สถานะจัดส่งเดินเองตามเวลา → เติมแจ้งเตือนขั้นที่ถึงแล้ว
    notificationService.syncDelivery();
    const timer = setInterval(() => notificationService.syncDelivery(), 15_000);
    onCleanup(() => clearInterval(timer));
  });
  return (
    <ThemeProvider>
      <Show when={!isToolPage(location.pathname)} fallback={props.children}>
        <MobileFrame>{props.children}</MobileFrame>
        <PrototypeNav />
        <MemberGateModal />
        <FlyToHome />
      </Show>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Title>Charmiss Club</Title>
          <I18nProvider>
            <Shell>
              <Suspense>{props.children}</Suspense>
            </Shell>
          </I18nProvider>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
