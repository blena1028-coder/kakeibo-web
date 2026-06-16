"use server";

import { revalidatePath } from "next/cache";
import { promises as fs } from "fs";
import path from "path";
import {
  readCategories,
  readQuickTemplates,
  readTransactions,
  writeCategories,
  writeQuickTemplates,
  writeTransactions
} from "@/lib/csv";
import { defaultHouseholdId } from "@/lib/households";
import { createId } from "@/lib/ids";
import type { SettingsActionState } from "@/lib/types";

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

export async function exportCsvFile(formData: FormData) {
  const fileName = String(formData.get("fileName") ?? "");
  const allowed = new Set([
    "transactions.csv",
    "categories.csv",
    "quick_templates.csv",
    "households.csv",
    "household_members.csv",
    "users.csv"
  ]);

  if (!allowed.has(fileName)) return "";
  const csv = await fs.readFile(path.join(process.cwd(), "data", fileName), "utf8");
  return csv;
}

export async function updateCategories(
  _previousState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const ids = formData.getAll("category_ids").map(String);
  const { householdId, basePath } = actionScope(formData);
  const categories = await readCategories(householdId);
  const now = new Date().toISOString();
  const newCategoryName = String(formData.get("new_category_name") ?? "").trim().slice(0, 10);

  const updatedCategories = categories.map((category) => {
      if (!ids.includes(category.id)) return category;
      const name = String(formData.get(`category_${category.id}_name`) ?? "").trim().slice(0, 10);
      return {
        ...category,
        name: name || category.name,
        updated_at: now
      };
    });

  if (newCategoryName) {
    updatedCategories.push({
      id: createId("cat"),
      household_id: householdId,
      name: newCategoryName,
      icon: "tag",
      sort_order: Math.max(0, ...categories.map((category) => category.sort_order)) + 10,
      created_at: now,
      updated_at: now
    });
  }

  await writeCategories(updatedCategories, householdId);

  revalidateScoped(basePath);

  return { ok: true, message: "保存しました。" };
}

export async function reorderCategories(
  _previousState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const orderedIds = formData.getAll("category_order").map(String);
  const { householdId, basePath } = actionScope(formData);
  const categories = await readCategories(householdId);
  const now = new Date().toISOString();
  const orderMap = new Map(orderedIds.map((id, index) => [id, (index + 1) * 10]));
  const reorderedCategories = categories.map((category) => ({
    ...category,
    sort_order: orderMap.get(category.id) ?? category.sort_order,
    updated_at: orderMap.has(category.id) ? now : category.updated_at
  }));

  await writeCategories(reorderedCategories, householdId);
  revalidateScoped(basePath);

  return { ok: true, message: "並べ替えました。" };
}

export async function deleteCategory(
  _previousState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const id = String(formData.get("category_id") ?? "");
  if (!id) return { ok: false, message: "削除するカテゴリーが見つかりません。" };
  const { householdId, basePath } = actionScope(formData);

  const now = new Date().toISOString();
  const [categories, templates, transactions] = await Promise.all([
    readCategories(householdId),
    readQuickTemplates(householdId),
    readTransactions(householdId)
  ]);

  await Promise.all([
    writeCategories(categories.filter((category) => category.id !== id), householdId),
    writeQuickTemplates(
      templates.map((template) =>
        template.category_id === id ? { ...template, category_id: "", updated_at: now } : template
      ),
      householdId
    ),
    writeTransactions(
      transactions.map((tx) =>
        tx.category_id === id ? { ...tx, category_id: "", updated_at: now } : tx
      ),
      householdId
    )
  ]);

  revalidateScoped(basePath);

  return { ok: true, message: "削除しました。" };
}
