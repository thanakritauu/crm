import { useLocation, useNavigate } from "@solidjs/router";
import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { AddressCard } from "~/components/account/address-card";
import { useAddressBookNav, type AddressToast } from "~/components/account/address-form";
import { BottomActionBar, BottomActionBarSpacer } from "~/components/layout/bottom-action-bar";
import { PageHeader } from "~/components/layout/page-header";
import { Button } from "~/components/ui/button";
import { EmptyData } from "~/components/ui/empty-data";
import { useI18n } from "~/lib/i18n";
import { addressService } from "~/services/address-service";
import { Toast } from "~/components/ui/toast";
import { useMemberOnly } from "~/lib/member-gate";
import { takeFlash, useBackWith } from "~/lib/navigation";

const TOAST_KEY: Record<AddressToast, string> = {
  added: "profile.add_address_success",
  edited: "profile.edit_address_success",
  deleted: "profile.delete_address_success",
};

/**
 * /:partner/personal-information/address — สมุดที่อยู่จัดส่งสินค้า (Figma My Add address 871:7070 / 875:8057)
 * การ์ดที่อยู่ (ค่าเริ่มต้นอยู่บนสุด ขอบชมพู) + ปุ่ม "เพิ่มที่อยู่" ติดล่าง · ไม่มีที่อยู่ → EmptyData
 * กลับจากฟอร์มพร้อม state.toast → toast เขียว 3 วินาที (เพิ่ม / แก้ไข / ลบ สำเร็จ)
 * โหมดเลือก: ?select=1&return=<path>[&selected=<id>] → การ์ดมี radio, กดการ์ด → /:partner/<return>?address=<id> (replace)
 *   ย้อนกลับ → /:partner/<return> โดยไม่เปลี่ยนที่อยู่
 */
export default function AddressBookPage() {
  useMemberOnly();
  const { t } = useI18n();
  const navigate = useNavigate();
  const backWith = useBackWith();
  const location = useLocation<{ toast?: AddressToast }>();
  const nav = useAddressBookNav();
  const [toast, setToast] = createSignal<string>();
  // รายการอยู่ใน localStorage → แสดงหลังโหลดเสร็จ (ไม่ให้ EmptyData กระพริบ)
  const [ready, setReady] = createSignal(false);

  onMount(() => {
    addressService.restore();
    setReady(true);
    const sent = takeFlash<{ toast?: AddressToast }>()?.toast ?? location.state?.toast;
    const key = sent && TOAST_KEY[sent];
    if (!key) return;
    setToast(t(key));
    const timer = setTimeout(() => setToast(undefined), 3000);
    onCleanup(() => clearTimeout(timer));
  });

  const list = () => addressService.list();
  /** ที่อยู่ที่ถูกเลือกในโหมดเลือก: selected=<id> จากหน้าที่เรียก → ไม่มี/ไม่พบ ใช้ค่าเริ่มต้น */
  const selectedId = () => (nav.selectedId() && addressService.get(nav.selectedId()) ? nav.selectedId() : addressService.defaultAddress()?.id);

  return (
    <div class="min-h-screen bg-white">
      <PageHeader
        title={t("profile.shipping_address")}
        backTo={nav.selectMode() ? nav.returnTo() : "profile"}
      />

      <Show
        when={ready() && list().length}
        fallback={<Show when={ready()}><EmptyData title={t("profile.empty_shipping_address")} class="px-4" /></Show>}
      >
        <div class="flex flex-col gap-4 px-4 pb-4" role={nav.selectMode() ? "radiogroup" : undefined}>
          <For each={list()}>
            {(a) => (
              <AddressCard
                address={a}
                showDefault
                selected={nav.selectMode() ? a.id === selectedId() : a.is_default}
                onSelect={nav.selectMode() ? () => backWith(nav.returnTo(a.id)) : undefined}
                onEdit={() => navigate(nav.editPath(a.id))}
              />
            )}
          </For>
        </div>
      </Show>

      <BottomActionBarSpacer />

      <Toast text={toast()} />

      <BottomActionBar>
        <Button size="block" onClick={() => navigate(nav.newPath())}>
          {t("profile.add_address")}
        </Button>
      </BottomActionBar>
    </div>
  );
}
