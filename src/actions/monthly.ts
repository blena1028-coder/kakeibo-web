"use server";

import { revalidatePath } from "next/cache";
import {
  readMonthlyAdjustments,
  readMonthlyClosings,
  readTransactions,
  writeMonthlyAdjustments,
  writeMonthlyClosings
} from "@/lib/csv";
import { nextMonthKey } from "@/lib/date";
import { defaultHouseholdId } from "@/lib/households";
import { createId } from "@/lib/ids";
import { calculateSettlement, filterAdjustmentsThisMonth, filterThisMonth, isMonthClosed } from "@/lib/settlement";
import type { MemberId, SettingsActionState } from "@/lib/types";

function actionScope(formData: FormData) {
  const householdId = String(formData.get("household_id") ?? defaultHouseholdId);
  const basePath = String(formData.get("base_path") ?? "");
  return { householdId, basePath };
}

function revalidateScoped(basePath: string) {
  revalidatePath(basePath || "/");
  revalidatePath(`${basePath}/history`);
  revalidatePath(`${basePath}/analytics`);
}

function directionFromDifference(difference: number): { from: MemberId; to: MemberId } {
  return difference > 0 ? { from: "B", to: "A" } : { from: "A", to: "B" };
}

export async function closeMonth(
  _previousState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const month = String(formData.get("month") ?? "");
  if (!/^\d{4}-\d{2}$/.test(month)) return { ok: false, message: "締める月を選択してください。" };

  const { householdId, basePath } = actionScope(formData);
  const [transactions, adjustments, closings] = await Promise.all([
    readTransactions(householdId),
    readMonthlyAdjustments(householdId),
    readMonthlyClosings(householdId)
  ]);

  if (isMonthClosed(month, closings)) return { ok: false, message: "この月はすでに締め済みです。" };

  const monthTransactions = filterThisMonth(transactions, month);
  const monthAdjustments = filterAdjustmentsThisMonth(adjustments, month);
  const settlement = calculateSettlement(monthTransactions, undefined, monthAdjustments);
  const carryoverMonth = nextMonthKey(month);
  const now = new Date().toISOString();
  const direction = directionFromDifference(settlement.difference || 1);
  const carryoverAmount = settlement.difference;

  await Promise.all([
    writeMonthlyClosings(
      [
        ...closings,
        {
          id: createId("close"),
          household_id: householdId,
          month,
          carryover_month: carryoverMonth,
          carryover_amount: carryoverAmount,
          created_at: now,
          updated_at: now
        }
      ],
      householdId
    ),
    writeMonthlyAdjustments(
      [
        ...adjustments.filter((adjustment) => !(adjustment.kind === "carryover" && adjustment.source_month === month)),
        {
          id: createId("adj"),
          household_id: householdId,
          month: carryoverMonth,
          kind: "carryover",
          source_month: month,
          amount_signed: carryoverAmount,
          from_member: direction.from,
          to_member: direction.to,
          memo: `${month}月締め繰越`,
          created_at: now,
          updated_at: now
        }
      ],
      householdId
    )
  ]);

  revalidateScoped(basePath);
  return { ok: true, message: `${month}を月締めしました。${carryoverMonth}へ繰り越しました。` };
}

export async function recordSettlementPayment(
  _previousState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const month = String(formData.get("month") ?? "");
  const amount = Math.floor(Number(formData.get("amount") ?? 0));
  if (!/^\d{4}-\d{2}$/.test(month)) return { ok: false, message: "精算する月を選択してください。" };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, message: "精算額を1円以上で入力してください。" };

  const { householdId, basePath } = actionScope(formData);
  const [transactions, adjustments] = await Promise.all([
    readTransactions(householdId),
    readMonthlyAdjustments(householdId)
  ]);
  const settlement = calculateSettlement(
    filterThisMonth(transactions, month),
    undefined,
    filterAdjustmentsThisMonth(adjustments, month)
  );

  if (!settlement.fromMember || !settlement.toMember || settlement.settlementFloor <= 0) {
    return { ok: false, message: "精算できる金額がありません。" };
  }

  const paymentAmount = Math.min(amount, settlement.settlementFloor);
  const now = new Date().toISOString();
  const amountSigned = settlement.difference > 0 ? -paymentAmount : paymentAmount;

  await writeMonthlyAdjustments(
    [
      {
        id: createId("pay"),
        household_id: householdId,
        month,
        kind: "payment",
        source_month: month,
        amount_signed: amountSigned,
        from_member: settlement.fromMember,
        to_member: settlement.toMember,
        memo: "精算",
        created_at: now,
        updated_at: now
      },
      ...adjustments
    ],
    householdId
  );

  revalidateScoped(basePath);
  return { ok: true, message: `${paymentAmount.toLocaleString("ja-JP")}円を精算しました。` };
}
