"use server";

import { revalidatePath } from "next/cache";
import { createId } from "@/lib/ids";
import { readMonthlyClosings, readTransactions, writeTransactions } from "@/lib/csv";
import { defaultHouseholdId } from "@/lib/households";
import { isMonthClosed } from "@/lib/settlement";
import { parseTransactionForm } from "@/lib/validation";
import type { TransactionFormState } from "@/lib/types";

function actionScope(formData: FormData) {
  const householdId = String(formData.get("household_id") ?? defaultHouseholdId);
  const basePath = String(formData.get("base_path") ?? "");
  return { householdId, basePath };
}

function revalidateScoped(basePath: string) {
  revalidatePath(basePath || "/");
  revalidatePath(`${basePath}/history`);
  revalidatePath(`${basePath}/analytics`);
  revalidatePath(`${basePath}/settings`);
}

export async function saveTransaction(
  _previousState: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  const parsed = parseTransactionForm(formData);
  if (!parsed.value) return parsed.state!;
  const { householdId, basePath } = actionScope(formData);

  const transactions = await readTransactions(householdId);
  const closings = await readMonthlyClosings(householdId);
  const now = new Date().toISOString();
  const existing = parsed.value.id
    ? transactions.find((tx) => tx.id === parsed.value?.id)
    : undefined;

  if (existing && isMonthClosed(existing.date.slice(0, 7), closings)) {
    return { ok: false, message: "月締め済みの履歴は編集できません。" };
  }
  if (isMonthClosed(parsed.value.date.slice(0, 7), closings)) {
    return { ok: false, message: "月締め済みの月には登録できません。" };
  }

  const next = {
    id: existing?.id ?? createId("tx"),
    household_id: householdId,
    date: parsed.value.date,
    amount: parsed.value.amount,
    category_id: parsed.value.category_id,
    memo: parsed.value.memo,
    payer_ids: parsed.value.payer_ids,
    created_by: existing?.created_by ?? parsed.value.created_by,
    created_at: existing?.created_at ?? now,
    updated_at: now
  };

  await writeTransactions(
    existing
      ? transactions.map((tx) => (tx.id === existing.id ? next : tx))
      : [next, ...transactions],
    householdId
  );

  revalidateScoped(basePath);
  return { ok: true, message: existing ? "履歴を更新しました" : "支出を保存しました" };
}

export async function deleteTransaction(
  _previousState: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "削除対象が見つかりません" };
  const { householdId, basePath } = actionScope(formData);

  const [transactions, closings] = await Promise.all([
    readTransactions(householdId),
    readMonthlyClosings(householdId)
  ]);
  const target = transactions.find((tx) => tx.id === id);
  if (target && isMonthClosed(target.date.slice(0, 7), closings)) {
    return { ok: false, message: "月締め済みの履歴は削除できません。" };
  }
  await writeTransactions(transactions.filter((tx) => tx.id !== id), householdId);

  revalidateScoped(basePath);
  return { ok: true, message: "削除しました。" };
}
