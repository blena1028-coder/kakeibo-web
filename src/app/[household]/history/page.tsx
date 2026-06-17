import { HistoryClient } from "@/components/history-client";
import { readCategories, readHouseholdMembers, readMonthlyAdjustments, readMonthlyClosings, readQuickTemplates, readTransactions } from "@/lib/csv";
import { householdBasePath, householdIdFromSlug } from "@/lib/households";
import { buildMemberNameMap } from "@/lib/members";

export const dynamic = "force-dynamic";

export default async function HouseholdHistoryPage({ params }: { params: Promise<{ household: string }> }) {
  const { household } = await params;
  const householdId = householdIdFromSlug(household);
  const basePath = householdBasePath(householdId);
  const [transactions, categories, templates, members, closings, adjustments] = await Promise.all([
    readTransactions(householdId),
    readCategories(householdId),
    readQuickTemplates(householdId),
    readHouseholdMembers(householdId),
    readMonthlyClosings(householdId),
    readMonthlyAdjustments(householdId)
  ]);
  const memberNames = buildMemberNameMap(members);

  return (
    <HistoryClient
      transactions={transactions}
      categories={categories}
      templates={templates}
      memberNames={memberNames}
      householdId={householdId}
      basePath={basePath}
      closings={closings}
      adjustments={adjustments}
    />
  );
}
