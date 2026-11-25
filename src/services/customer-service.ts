import { session } from "~/lib/session";
import { addressTree } from "~/mocks/address";
import { consentHtml, registrationFields } from "~/mocks/policy";

/** ต้นฉบับ: customer-service, province-service, settings-service */
export const customerService = {
  me: () => session.customer,
  provinces: () => Object.keys(addressTree),
  districts: (province: string) => Object.keys(addressTree[province] ?? {}),
  subDistricts: (province: string, district: string) => Object.keys(addressTree[province]?.[district] ?? {}),
  zipcode: (province: string, district: string, sub: string) => addressTree[province]?.[district]?.[sub] ?? "",
  consentHtml: () => consentHtml,
  registrationFields: () => registrationFields,
};
