import { readCategories, readHouseholdMembers, readHouseholds, readQuickTemplates, readTransactions } from "@/lib/csv";
import { defaultHouseholdId, householdBasePath, householdNameOrSlug } from "@/lib/households";
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

export default async function SettingsPage() {
  const [categories, templates, members, transactions, households] = await Promise.all([
    readCategories(defaultHouseholdId),
    readQuickTemplates(defaultHouseholdId),
    readHouseholdMembers(defaultHouseholdId),
    readTransactions(defaultHouseholdId),
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
  const household = households.find((item) => item.id === defaultHouseholdId);
  const householdName = householdNameOrSlug(defaultHouseholdId, household?.name);

  return (
    <main className="space-y-5">
      <header>
        <p className="eyebrow">Settings</p>
        <h1>設定</h1>
      </header>

      <SettingsClient
        categories={categories}
        categoryUsage={categoryUsage}
        householdId={defaultHouseholdId}
        basePath={householdBasePath(defaultHouseholdId)}
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
