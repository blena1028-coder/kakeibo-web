import { readCategories, readHouseholdMembers, readTransactions } from "@/lib/csv";
import { formatYen } from "@/lib/date";
import { defaultHouseholdId } from "@/lib/households";
import { buildMemberNameMap } from "@/lib/members";
import { calculateSettlement } from "@/lib/settlement";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [transactions, categories, members] = await Promise.all([
    readTransactions(defaultHouseholdId),
    readCategories(defaultHouseholdId),
    readHouseholdMembers(defaultHouseholdId)
  ]);
  const memberNames = buildMemberNameMap(members);
  const byMonth = new Map<string, number>();
  const byCategory = new Map<string, number>();

  for (const tx of transactions) {
    const month = tx.date.slice(0, 7);
    byMonth.set(month, (byMonth.get(month) ?? 0) + tx.amount);
    byCategory.set(tx.category_id || "uncategorized", (byCategory.get(tx.category_id || "uncategorized") ?? 0) + tx.amount);
  }

  const settlement = calculateSettlement(transactions, memberNames);
  const categoryName = (id: string) => categories.find((category) => category.id === id)?.name ?? "未分類";

  return (
    <main className="space-y-5">
      <header>
        <p className="eyebrow">Analytics</p>
        <h1>分析</h1>
      </header>

      <section className="summary-grid">
        <div className="metric">
          <span>{memberNames.A}負担</span>
          <strong>{formatYen(settlement.aBurden)}</strong>
        </div>
        <div className="metric accent">
          <span>{memberNames.B}負担</span>
          <strong>{formatYen(settlement.bBurden)}</strong>
        </div>
      </section>

      <section className="panel">
        <h2>月別支出</h2>
        <div className="stack-list">
          {[...byMonth.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([month, amount]) => (
            <div className="bar-row" key={month}>
              <span>{month}</span>
              <strong>{formatYen(amount)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>カテゴリー別支出</h2>
        <div className="stack-list">
          {[...byCategory.entries()].sort((a, b) => b[1] - a[1]).map(([id, amount]) => (
            <div className="bar-row" key={id}>
              <span>{categoryName(id)}</span>
              <strong>{formatYen(amount)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="settlement-band">
        <span>精算目安</span>
        <strong>{settlement.settlementText}</strong>
      </section>
    </main>
  );
}
