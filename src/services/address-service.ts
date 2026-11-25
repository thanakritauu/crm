import { createStore } from "solid-js/store";
import { session } from "~/lib/session";

/**
 * สมุดที่อยู่จัดส่งสินค้า (Figma Reward: Add address 393:2660 / My Add address 871:7070)
 * เก็บได้หลายที่อยู่ · ประเภท บ้าน / ที่ทำงาน / อื่นๆ · ตั้งค่าเริ่มต้นได้ 1 ที่อยู่ · บันทึกใน localStorage
 * ใช้ร่วมกันระหว่างหน้าที่อยู่ (โปรไฟล์) และหน้าสรุปคำสั่งจัดส่งสิทธิพิเศษ
 */
export type AddressType = "home" | "work" | "other";
export type ShippingAddress = {
  id: string;
  /** ข้อมูลผู้รับ */
  name: string;
  surname: string;
  phone: string;
  /** รายละเอียดที่อยู่ */
  detail: string;
  province: string;
  district: string;
  sub_district: string;
  zipcode: string;
  type: AddressType;
  is_default: boolean;
};
export type AddressInput = Omit<ShippingAddress, "id">;

type AddressState = { list: ShippingAddress[] };
const STORAGE_KEY = "charmiss-prototype-addresses-v1";

/** ค่าเริ่มต้น: ที่อยู่เดิมของลูกค้าใน mock 1 รายการ (ตั้งเป็นค่าเริ่มต้น) */
const initialState = (): AddressState => {
  const c = session.customer;
  if (!c.address?.detail) return { list: [] };
  return {
    list: [
      {
        id: "addr-1",
        name: c.name,
        surname: c.surname,
        phone: c.phone,
        ...c.address,
        type: "home",
        is_default: true,
      },
    ],
  };
};

const [state, setState] = createStore<AddressState>({ list: [] });
let restored = false;

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/** ที่อยู่ค่าเริ่มต้นอยู่บนสุดเสมอ */
const sorted = () => [...state.list].sort((a, b) => Number(b.is_default) - Number(a.is_default));

export const addressService = {
  /** โหลดจาก localStorage — เรียกหลัง mount (ฝั่ง client) · ครั้งแรกใช้ที่อยู่เดิมของลูกค้า */
  restore() {
    if (restored) return;
    restored = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setState(raw ? JSON.parse(raw) : initialState());
    } catch {
      setState(initialState());
    }
  },
  reset() {
    setState({ list: [] });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    restored = false;
  },

  list: (): ShippingAddress[] => sorted(),
  get: (id: string) => state.list.find((a) => a.id === id),
  defaultAddress: (): ShippingAddress | undefined => state.list.find((a) => a.is_default) ?? state.list[0],

  /** เพิ่มที่อยู่ — ที่อยู่แรก หรือเลือก "ตั้งเป็นค่าเริ่มต้น" จะเป็นค่าเริ่มต้น */
  add(input: AddressInput): ShippingAddress {
    const item: ShippingAddress = { ...input, id: `addr-${Date.now()}`, is_default: input.is_default || state.list.length === 0 };
    setState("list", (list) => [...(item.is_default ? list.map((a) => ({ ...a, is_default: false })) : list), item]);
    persist();
    return item;
  },
  update(id: string, input: AddressInput) {
    setState("list", (list) =>
      list.map((a) => (a.id === id ? { ...input, id } : input.is_default ? { ...a, is_default: false } : a)),
    );
    // ต้องมีค่าเริ่มต้นอย่างน้อย 1 ที่อยู่
    if (!state.list.some((a) => a.is_default) && state.list.length) setState("list", 0, "is_default", true);
    persist();
  },
  remove(id: string) {
    const wasDefault = state.list.find((a) => a.id === id)?.is_default;
    setState("list", (list) => list.filter((a) => a.id !== id));
    if (wasDefault && state.list.length) setState("list", 0, "is_default", true);
    persist();
  },
  setDefault(id: string) {
    setState("list", (list) => list.map((a) => ({ ...a, is_default: a.id === id })));
    persist();
  },

  /** ข้อความที่อยู่บรรทัดเดียว เช่น "188/38 … แขวงวังใหม่ เขตปทุมวัน กรุงเทพมหานคร 10330" */
  format: (a: Pick<ShippingAddress, "detail" | "sub_district" | "district" | "province" | "zipcode">) =>
    [a.detail, a.sub_district, a.district, a.province, a.zipcode].filter(Boolean).join(" "),
};
