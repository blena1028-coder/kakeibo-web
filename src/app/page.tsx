import { HomeClient } from "@/components/home-client";
import { readCategories, readHouseholdMembers, readHouseholds, readMonthlyAdjustments, readQuickTemplates, readTransactions } from "@/lib/csv";
import { currentMonthKey } from "@/lib/date";
import { defaultHouseholdId, householdBasePath, householdNameOrSlug, householdTitle } from "@/lib/households";
import { buildMemberNameMap } from "@/lib/members";
import { calculateSettlement, filterAdjustmentsThisMonth, filterThisMonth } from "@/lib/settlement";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [transactions, categories, templates, members, households, adjustments] = await Promise.all([
    readTransactions(defaultHouseholdId),
    readCategories(defaultHouseholdId),
    readQuickTemplates(defaultHouseholdId),
    readHouseholdMembers(defaultHouseholdId),
    readHouseholds(),
    readMonthlyAdjustments(defaultHouseholdId)
  ]);
  const memberNames = buildMemberNameMap(members);
  const monthKey = currentMonthKey();
  const monthTransactions = filterThisMonth(transactions, monthKey);
  const settlement = calculateSettlement(monthTransactions, memberNames, filterAdjustmentsThisMonth(adjustments, monthKey));
  const household = households.find((item) => item.id === defaultHouseholdId);
  const title = householdTitle(householdNameOrSlug(defaultHouseholdId, household?.name));

  return (
    <HomeClient
      categories={categories}
      householdId={defaultHouseholdId}
      basePath={householdBasePath(defaultHouseholdId)}
      householdTitle={title}
      memberNames={memberNames}
      templates={templates}
      transactions={transactions.slice(0, 5)}
      settlement={settlement}
    />
  );
}
