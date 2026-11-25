import { useNavigate } from "@solidjs/router";
import { createSignal, onMount, Show } from "solid-js";
import { AddressForm, emptyAddress, useAddressBookNav, type AddressFormValue, type AddressToast } from "~/components/account/address-form";
import { PageHeader } from "~/components/layout/page-header";
import { PageLoading } from "~/components/ui/page-loading";
import { useI18n } from "~/lib/i18n";
import { session } from "~/lib/session";
import { addressService, type AddressInput } from "~/services/address-service";
import { DiscardChangesModal } from "~/components/ui/discard-changes-modal";
import { useMemberOnly } from "~/lib/member-gate";
import { useGoBack, useBackWith } from "~/lib/navigation";

/**
 * /:partner/personal-information/address/new — เพิ่มที่อยู่ (Figma Add address 393:2660)
 * ที่อยู่แรก → เติมชื่อ/นามสกุล/เบอร์จากข้อมูลลูกค้า และติ๊กค่าเริ่มต้นไว้
 * บันทึก → addressService.add → กลับหน้ารายการพร้อม toast "เพิ่ม...สำเร็จ" · โหมดเลือก → กลับหน้าที่เรียกพร้อม ?address=<ที่อยู่ใหม่>
 */
export default function NewAddressPage() {
  useMemberOnly();
  const { t } = useI18n();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const backWith = useBackWith();
  const nav = useAddressBookNav();
  const [initial, setInitial] = createSignal<AddressFormValue>();
  const [saving, setSaving] = createSignal(false);
  const [dirty, setDirty] = createSignal(false);
  const [discardOpen, setDiscardOpen] = createSignal(false);

  onMount(() => {
    addressService.restore();
    const first = addressService.list().length === 0;
    const c = session.customer;
    setInitial(first ? { ...emptyAddress(), name: c.name ?? "", surname: c.surname ?? "", phone: c.phone ?? "", is_default: true } : emptyAddress());
  });

  const save = (input: AddressInput) => {
    setSaving(true);
    setTimeout(() => {
      const added = addressService.add(input);
      setSaving(false);
      // มาจากหน้าที่ต้องเลือกที่อยู่ (เช่น สรุปคำสั่งจัดส่ง) → กลับไปพร้อมที่อยู่ใหม่ทันที
      if (nav.selectMode()) return backWith(nav.returnTo(added.id));
      backWith(nav.listPath(), { toast: "added" satisfies AddressToast });
    }, 500);
  };

  return (
    <div class="min-h-screen bg-white">
      <PageHeader title={t("profile.shipping_address")} onBack={() => (dirty() ? setDiscardOpen(true) : goBack(nav.listPath()))} />
      <Show when={initial()}>{(init) => <AddressForm initial={init()} onSubmit={save} onDirtyChange={setDirty} />}</Show>
      <DiscardChangesModal open={discardOpen()} onOpenChange={setDiscardOpen} onDiscard={() => goBack(nav.listPath())} />
      <PageLoading show={saving()} message={t("common.in_progress_wait_a_moment")} />
    </div>
  );
}
