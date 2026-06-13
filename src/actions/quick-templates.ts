"use server";

import { revalidatePath } from "next/cache";
import { readQuickTemplates, writeQuickTemplates } from "@/lib/csv";
import { defaultHouseholdId } from "@/lib/households";
import { createId } from "@/lib/ids";
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
  revalidatePath(`${basePath}/settings`);
}

export async function touchQuickTemplates() {
  revalidatePath("/");
  revalidatePath("/settings");
}

export async function updateQuickTemplates(
  _previousState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const ids = formData.getAll("template_ids").map(String);
  const { householdId, basePath } = actionScope(formData);
  const templates = await readQuickTemplates(householdId);
  const now = new Date().toISOString();
  const errors: string[] = [];
  const newLabel = String(formData.get("new_template_label") ?? "").trim().slice(0, 10);
  const newAmountRaw = String(formData.get("new_template_amount") ?? "").trim();
  const newAmount = newAmountRaw ? Number(newAmountRaw) : 0;
  const newCategoryId = String(formData.get("new_template_category_id") ?? "");
  const newMemo = String(formData.get("new_template_memo") ?? "").trim().slice(0, 120);
  const newPayerIds = formData
    .getAll("new_template_payer_ids")
    .map(String)
    .filter((value): value is MemberId => value === "A" || value === "B");

  const nextTemplates = templates.map((template) => {
    if (!ids.includes(template.id)) return template;

    const label = String(formData.get(`template_${template.id}_label`) ?? "").trim().slice(0, 10);
    const amountRaw = String(formData.get(`template_${template.id}_amount`) ?? "").trim();
    const amount = amountRaw ? Number(amountRaw) : 0;
    const category_id = String(formData.get(`template_${template.id}_category_id`) ?? "");
    const memo = String(formData.get(`template_${template.id}_memo`) ?? "").trim().slice(0, 120);
    const payer_ids = formData
      .getAll(`template_${template.id}_payer_ids`)
      .map(String)
      .filter((value): value is MemberId => value === "A" || value === "B");

    if (!label) errors.push("ショートカット名を入力してください。");
    if (amountRaw && (Number.isNaN(amount) || amount < 0)) errors.push("金額は0円以上で入力してください。");
    if (amount > 99999999) errors.push("金額は8桁以内で入力してください。");

    return {
      ...template,
      label: label || template.label,
      amount,
      category_id,
      memo,
      payer_ids,
      updated_at: now
    };
  });

  if (errors.length > 0) {
    return { ok: false, message: [...new Set(errors)].join(" ") };
  }

  if (newLabel || newAmount || newMemo || newPayerIds.length > 0) {
    if (!newLabel) errors.push("ショートカット名を入力してください。");
    if (newAmountRaw && (Number.isNaN(newAmount) || newAmount < 0)) errors.push("金額は0円以上で入力してください。");
    if (newAmount > 99999999) errors.push("金額は8桁以内で入力してください。");

    if (errors.length > 0) {
      return { ok: false, message: [...new Set(errors)].join(" ") };
    }

    nextTemplates.push({
      id: createId("tpl"),
      household_id: householdId,
      label: newLabel,
      amount: newAmount,
      category_id: newCategoryId,
      memo: newMemo,
      payer_ids: newPayerIds,
      sort_order: Math.max(0, ...templates.map((template) => template.sort_order)) + 10,
      created_at: now,
      updated_at: now
    });
  }

  await writeQuickTemplates(nextTemplates, householdId);
  revalidateScoped(basePath);

  return { ok: true, message: "保存しました。" };
}

export async function deleteQuickTemplate(
  _previousState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const id = String(formData.get("template_id") ?? "");
  if (!id) return { ok: false, message: "削除する入力が見つかりません。" };
  const { householdId, basePath } = actionScope(formData);

  const templates = await readQuickTemplates(householdId);
  await writeQuickTemplates(templates.filter((template) => template.id !== id), householdId);

  revalidateScoped(basePath);

  return { ok: true, message: "削除しました。" };
}
