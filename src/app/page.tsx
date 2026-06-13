import { HomeClient } from "@/components/home-client";
import { readCategories, readHouseholdMembers, readHouseholds, readQuickTemplates, readTransactions } from "@/lib/csv";
import { currentMonthKey } from "@/lib/date";
import { defaultHouseholdId, householdBasePath, householdNameOrSlug, householdTitle } from "@/lib/households";
import { buildMemberNameMap } from "@/lib/members";
import { calculateSettlement, filterThisMonth } from "@/lib/settlement";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [transactions, categories, templates, members, households] = await Promise.all([
    readTransactions(defaultHouseholdId),
    readCategories(defaultHouseholdId),
    readQuickTemplates(defaultHouseholdId),
    readHouseholdMembers(defaultHouseholdId),
    readHouseholds()
  ]);
  const memberNames = buildMemberNameMap(members);
  const monthTransactions = filterThisMonth(transactions, currentMonthKey());
  const settlement = calculateSettlement(monthTransactions, memberNames);
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
