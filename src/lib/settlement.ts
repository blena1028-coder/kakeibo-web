import { defaultMemberNames } from "@/lib/members";
import type { MemberNameMap, MonthlyAdjustment, Settlement, Transaction } from "@/lib/types";

export function calculateSettlement(
  transactions: Transaction[],
  memberNames: MemberNameMap = defaultMemberNames,
  adjustments: MonthlyAdjustment[] = []
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

  const adjustmentBalance = adjustments.reduce((sum, adjustment) => sum + adjustment.amount_signed, 0);
  const aBalance = base.aPaid - base.aBurden + adjustmentBalance;
  const difference = aBalance;
  const settlementAmount = Math.abs(aBalance);
  const settlementFloor = Math.floor(settlementAmount);
  const remainderYen = Math.round((settlementAmount - settlementFloor) * 2) === 1 ? 1 : 0;
  const fromMember = aBalance > 0 ? "B" : aBalance < 0 ? "A" : undefined;
  const toMember = aBalance > 0 ? "A" : aBalance < 0 ? "B" : undefined;
  let settlementText = "負担はほぼ同じです";

  if (fromMember && toMember && (settlementFloor >= 1 || remainderYen === 1)) {
    const remainderText = remainderYen === 1 ? " 端数1円" : "";
    settlementText = `${memberNames[fromMember]}から${memberNames[toMember]}へ 精算額${settlementFloor.toLocaleString("ja-JP")}円${remainderText}`;
  }

  return {
    total: base.total,
    aBurden: base.aBurden,
    bBurden: base.bBurden,
    difference,
    settlementAmount,
    settlementFloor,
    remainderYen,
    settlementText,
    fromMember,
    toMember
  };
}

export function filterThisMonth(transactions: Transaction[], monthKey: string) {
  return transactions.filter((tx) => tx.date.startsWith(monthKey));
}

export function filterAdjustmentsThisMonth(adjustments: MonthlyAdjustment[], monthKey: string) {
  return adjustments.filter((adjustment) => adjustment.month === monthKey);
}

export function latestClosedMonth(closings: { month: string }[]) {
  return closings.map((closing) => closing.month).sort().at(-1) ?? "";
}

export function isMonthClosed(monthKey: string, closings: { month: string }[]) {
  const latest = latestClosedMonth(closings);
  return Boolean(latest && monthKey <= latest);
}
