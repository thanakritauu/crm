import { For, Show } from "solid-js";
import { ActivityEmpty, ActivityGroupTitle, ActivityRow } from "~/components/history/activity-row";
import { IconCoins, IconGift, IconHistory } from "~/components/ui/icons";
import { useI18n } from "~/lib/i18n";
import { formatDate, formatNumber, txText } from "~/lib/utils";
import type { PointTransaction } from "~/mocks/history";
import { groupByMonth } from "~/services/history-service";

/**
 * รายการธุรกรรมคอยน์ จัดกลุ่มตามเดือน (point-history.js ของต้นฉบับ)
 * แถวแบบหน้าการแจ้งเตือน (ActivityRow): ไอคอน ได้รับ = เหรียญ / ใช้ = ของขวัญ · ข้อความ 14/600 + จำนวน (+เขียว / -แดง)
 * · วันที่ · ที่มา 12 สีเทา · หัวเดือน 14/600
 */
export function TransactionList(props: { items: PointTransaction[]; unit: string; emptyText: string }) {
  const { t } = useI18n();
  return (
    <Show when={props.items.length > 0} fallback={<ActivityEmpty icon={IconHistory} title={props.emptyText} />}>
      <For each={groupByMonth(props.items)}>
        {(group) => (
          <section>
            <ActivityGroupTitle>{group.month}</ActivityGroupTitle>
            <For each={group.items}>
              {(item) => (
                <ActivityRow
                  icon={item.amount >= 0 ? IconCoins : IconGift}
                  title={txText(item).title}
                  date={`${formatDate(item.date, true)}${t("common.time_suffix")}`}
                  source={txText(item).source}
                  amount={{
                    text: `${item.amount >= 0 ? "+" : "-"}${formatNumber(Math.abs(item.amount))} ${props.unit}`,
                    tone: item.amount >= 0 ? "success" : "error",
                  }}
                />
              )}
            </For>
          </section>
        )}
      </For>
    </Show>
  );
}
