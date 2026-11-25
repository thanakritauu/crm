import { rewardCategories, rewards } from "~/mocks/rewards";

/** ต้นฉบับ: redeem-service / product endpoints */
export const rewardService = {
  categories: () => rewardCategories,
  list: (category = "all") => (category === "all" ? rewards : rewards.filter((r) => r.category === category)),
  get: (id: string) => rewards.find((r) => r.id === id),
};
