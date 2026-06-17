import { HomeClient } from "@/components/home-client";
import { readCategories, readHouseholdMembers, readHouseholds, readMonthlyAdjustments, readQuickTemplates, readTransactions } from "@/lib/csv";
import { currentMonthKey } from "@/lib/date";
import { householdBasePath, householdIdFromSlug, householdNameOrSlug, householdTitle } from "@/lib/households";
import { buildMemberNameMap } from "@/lib/members";
import { calculateSettlement, filterAdjustmentsThisMonth, filterThisMonth } from "@/lib/settlement";

export const dynamic = "force-dynamic";

export default async function HouseholdHomePage({ params }: { params: Promise<{ household: string }> }) {
  const { household } = await params;
  const householdId = householdIdFromSlug(household);
  const basePath = householdBasePath(householdId);
  const [transactions, categories, templates, members, households, adjustments] = await Promise.all([
    readTransactions(householdId),
    readCategories(householdId),
    readQuickTemplates(householdId),
    readHouseholdMembers(householdId),
    readHouseholds(),
    readMonthlyAdjustments(householdId)
  ]);
  const memberNames = buildMemberNameMap(members);
  const monthKey = currentMonthKey();
  const monthTransactions = filterThisMonth(transactions, monthKey);
  const settlement = calculateSettlement(monthTransactions, memberNames, filterAdjustmentsThisMonth(adjustments, monthKey));
  const storedHousehold = households.find((item) => item.id === householdId);
  const title = householdTitle(householdNameOrSlug(householdId, storedHousehold?.name || household));

  return (
    <HomeClient
      categories={categories}
      householdId={householdId}
      basePath={basePath}
      householdTitle={title}
      memberNames={memberNames}
      templates={templates}
      transactions={transactions.slice(0, 5)}
      settlement={settlement}
    />
  );
}
