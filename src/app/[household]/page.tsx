import { HomeClient } from "@/components/home-client";
import { readCategories, readHouseholdMembers, readHouseholds, readQuickTemplates, readTransactions } from "@/lib/csv";
import { currentMonthKey } from "@/lib/date";
import { householdBasePath, householdIdFromSlug, householdNameOrSlug, householdTitle } from "@/lib/households";
import { buildMemberNameMap } from "@/lib/members";
import { calculateSettlement, filterThisMonth } from "@/lib/settlement";

export const dynamic = "force-dynamic";

export default async function HouseholdHomePage({ params }: { params: Promise<{ household: string }> }) {
  const { household } = await params;
  const householdId = householdIdFromSlug(household);
  const basePath = householdBasePath(householdId);
  const [transactions, categories, templates, members, households] = await Promise.all([
    readTransactions(householdId),
    readCategories(householdId),
    readQuickTemplates(householdId),
    readHouseholdMembers(householdId),
    readHouseholds()
  ]);
  const memberNames = buildMemberNameMap(members);
  const monthTransactions = filterThisMonth(transactions, currentMonthKey());
  const settlement = calculateSettlement(monthTransactions, memberNames);
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
