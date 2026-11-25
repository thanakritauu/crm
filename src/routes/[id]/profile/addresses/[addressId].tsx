import { useNavigate, useParams } from "@solidjs/router";
import { createSignal, onMount, Show } from "solid-js";
import { AddressForm, useAddressBookNav, type AddressFormValue, type AddressToast } from "~/components/account/address-form";
import { PageHeader } from "~/components/layout/page-header";
import { AlertDialog } from "~/components/ui/modal";
import { PageLoading } from "~/components/ui/page-loading";
import { useI18n } from "~/lib/i18n";
import { addressService, type AddressInput } from "~/services/address-service";
import { DiscardChangesModal } from "~/components/ui/discard-changes-modal";
import { useMemberOnly } from "~/lib/member-gate";
import { IconInfo } from "~/components/ui/icons";
import { useGoBack, useBackWith } from "~/lib/navigation";

/**
 * /:partner/personal-information/address/edit/:addressId — แก้ไขที่อยู่ (Figma Add address_Field 393:4163)
 * ฟอร์มเดียวกับหน้าเพิ่ม เติมค่าเดิม + ปุ่ม "ลบ" มุมขวาบน → ยืนยัน (Figma Confirm_ShopOrHome 875:7856)
 * บันทึก / ลบ → กลับหน้ารายการ (คง query โหมดเลือก) พร้อม toast · ไม่พบที่อยู่ → กลับหน้ารายการ
 */
export default function EditAddressPage() {
  useMemberOnly();
  const { t } = useI18n();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const backWith = useBackWith();
  const params = useParams<{ addressId: string }>();
  const nav = useAddressBookNav();
  const [initial, setInitial] = createSignal<AddressFormValue>();
  const [confirmOpen, setConfirmOpen] = createSignal(false);
  const [saving, setSaving] = createSignal(false);
  const [dirty, setDirty] = createSignal(false);
  const [discardOpen, setDiscardOpen] = createSignal(false);

  // บันทึก/ลบแล้ว → กลับหน้าก่อนหน้า (รายการ) พร้อม toast · ปุ่ม < → หน้าก่อนหน้า
  const backToList = (toast?: AddressToast) => backWith(nav.listPath(), toast ? { toast } : undefined);

  onMount(() => {
    addressService.restore();
    const a = addressService.get(params.addressId);
    if (!a) return backToList();
    const { id: _id, ...rest } = a;
    setInitial(rest);
  });

  const run = (fn: () => void, toast: AddressToast) => {
    setSaving(true);
    setTimeout(() => {
      fn();
      setSaving(false);
      backToList(toast);
    }, 500);
  };
  const save = (input: AddressInput) => run(() => addressService.update(params.addressId, input), "edited");
  const remove = () => run(() => addressService.remove(params.addressId), "deleted");

  return (
    <div class="min-h-screen bg-white">
      <PageHeader
        title={t("profile.shipping_address")}
        onBack={() => (dirty() ? setDiscardOpen(true) : goBack(nav.listPath()))}
        right={
          <Show when={initial()}>
            <button type="button" class="hit-area text-12 font-medium text-error underline" onClick={() => setConfirmOpen(true)}>
              {t("common.delete")}
            </button>
          </Show>
        }
      />
      <Show when={initial()}>{(init) => <AddressForm initial={init()} onSubmit={save} onDirtyChange={setDirty} />}</Show>

      <AlertDialog
        open={confirmOpen()}
        onOpenChange={setConfirmOpen}
        tone="warning"
        icon={<IconInfo size={24} class="text-warning" />}
        title={t("profile.confirm_delete_address")}
        description={t("account.delete_address_permanent")}
        destructive
        cancelText={t("common.cancel")}
        confirmText={t("common.delete")}
        onConfirm={remove}
      />
      <DiscardChangesModal open={discardOpen()} onOpenChange={setDiscardOpen} onDiscard={() => goBack(nav.listPath())} />
      <PageLoading show={saving()} message={t("common.in_progress_wait_a_moment")} />
    </div>
  );
}
