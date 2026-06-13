import { HistoryClient } from "@/components/history-client";
import { readCategories, readHouseholdMembers, readQuickTemplates, readTransactions } from "@/lib/csv";
import { defaultHouseholdId, householdBasePath } from "@/lib/households";
import { buildMemberNameMap } from "@/lib/members";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const [transactions, categories, templates, members] = await Promise.all([
    readTransactions(defaultHouseholdId),
    readCategories(defaultHouseholdId),
    readQuickTemplates(defaultHouseholdId),
    readHouseholdMembers(defaultHouseholdId)
  ]);
  const memberNames = buildMemberNameMap(members);

  return <HistoryClient transactions={transactions} categories={categories} templates={templates} memberNames={memberNames} householdId={defaultHouseholdId} basePath={householdBasePath(defaultHouseholdId)} />;
}
