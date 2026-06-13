import { defaultMemberNames } from "@/lib/members";
import type { MemberNameMap, Settlement, Transaction } from "@/lib/types";

export function calculateSettlement(
  transactions: Transaction[],
  memberNames: MemberNameMap = defaultMemberNames
): Settlement {
  const base = transactions.reduce(
    (acc, tx) => {
      acc.total += tx.amount;
      if (tx.created_by === "A") acc.aPaid += tx.amount;
      if (tx.created_by === "B") acc.bPaid += tx.amount;
      if (tx.payer_ids.length === 1 && tx.payer_ids[0] === "A") acc.aBurden += tx.amount;
      if (tx.payer_ids.length === 1 && tx.payer_ids[0] === "B") acc.bBurden += tx.amount;
      if (tx.payer_ids.includes("A") && tx.payer_ids.includes("B")) {
        acc.aBurden += tx.amount / 2;
        acc.bBurden += tx.amount / 2;
      }
      return acc;
    },
    { total: 0, aBurden: 0, bBurden: 0, aPaid: 0, bPaid: 0 }
  );

  const aBalance = base.aPaid - base.aBurden;
  const difference = aBalance;
  const settlementAmount = Math.abs(aBalance);
  let settlementText = "負担はほぼ同じです";

  if (settlementAmount >= 1) {
    settlementText =
      aBalance > 0
        ? `${memberNames.B}から${memberNames.A}へ ${Math.round(settlementAmount).toLocaleString("ja-JP")}円`
        : `${memberNames.A}から${memberNames.B}へ ${Math.round(settlementAmount).toLocaleString("ja-JP")}円`;
  }

  return {
    total: base.total,
    aBurden: base.aBurden,
    bBurden: base.bBurden,
    difference,
    settlementAmount,
    settlementText
  };
}

export function filterThisMonth(transactions: Transaction[], monthKey: string) {
  return transactions.filter((tx) => tx.date.startsWith(monthKey));
}
