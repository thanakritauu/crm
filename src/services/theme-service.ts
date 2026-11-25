import { delay } from "~/lib/utils";
import { themes, type PartnerTheme } from "~/mocks/theme";

/**
 * ต้นฉบับ: axios.get(`/api/theme?partner=${partner}`)
 * Prototype: คืนค่าจาก mock ทันที (ไม่มี backend)
 */
export async function getTheme(partner: string): Promise<PartnerTheme> {
  await delay(0);
  return themes[partner] ?? themes.charmiss;
}
