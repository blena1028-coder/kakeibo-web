import { readCategories, readHouseholdMembers, readHouseholds, readQuickTemplates, readTransactions } from "@/lib/csv";
import { householdBasePath, householdIdFromSlug, householdNameOrSlug } from "@/lib/households";
import { buildMemberNameMap } from "@/lib/members";
import { SettingsClient } from "@/components/settings-client";

const csvFiles = [
  "transactions.csv",
  "categories.csv",
  "quick_templates.csv",
  "households.csv",
  "household_members.csv",
  "users.csv"
];

export const dynamic = "force-dynamic";

export default async function HouseholdSettingsPage({ params }: { params: Promise<{ household: string }> }) {
  const { household } = await params;
  const householdId = householdIdFromSlug(household);
  const basePath = householdBasePath(householdId);
  const [categories, templates, members, transactions, households] = await Promise.all([
    readCategories(householdId),
    readQuickTemplates(householdId),
    readHouseholdMembers(householdId),
    readTransactions(householdId),
    readHouseholds()
  ]);
  const memberNames = buildMemberNameMap(members);
  const categoryUsage = categories.reduce<Record<string, { transactions: number; templates: number }>>((acc, category) => {
    acc[category.id] = {
      transactions: transactions.filter((tx) => tx.category_id === category.id).length,
      templates: templates.filter((template) => template.category_id === category.id).length
    };
    return acc;
  }, {});
  const storedHousehold = households.find((item) => item.id === householdId);
  const householdName = householdNameOrSlug(householdId, storedHousehold?.name || household);

  return (
    <main className="space-y-5">
      <header>
        <p className="eyebrow">Settings</p>
        <h1>設定</h1>
      </header>

      <SettingsClient
        categories={categories}
        categoryUsage={categoryUsage}
        householdId={householdId}
        basePath={basePath}
        householdName={householdName}
        memberNames={memberNames}
        templates={templates}
      />

      <section className="panel">
        <h2>CSV</h2>
        <div className="stack-list">
          {csvFiles.map((file) => (
            <div className="bar-row" key={file}>
              <span>{file}</span>
              <code>data/{file}</code>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
