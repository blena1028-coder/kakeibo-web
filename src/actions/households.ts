"use server";

import { revalidatePath } from "next/cache";
import { readHouseholds, writeHouseholds } from "@/lib/csv";
import { defaultHouseholdId, scopedPath } from "@/lib/households";
import type { SettingsActionState } from "@/lib/types";

function actionScope(formData: FormData) {
  const householdId = String(formData.get("household_id") ?? defaultHouseholdId);
  const basePath = String(formData.get("base_path") ?? "");
  return { householdId, basePath };
}

export async function updateHouseholdName(_: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const { householdId, basePath } = actionScope(formData);
  const name = String(formData.get("household_name") ?? "").trim().slice(0, 20);
  const now = new Date().toISOString();
  const households = await readHouseholds();
  const current = households.find((household) => household.id === householdId);
  const nextHouseholds = current
    ? households.map((household) => (household.id === householdId ? { ...household, name, updated_at: now } : household))
    : [
        ...households,
        {
          id: householdId,
          name,
          created_at: now,
          updated_at: now
        }
      ];

  await writeHouseholds(nextHouseholds);
  revalidatePath(scopedPath(basePath, "/"));
  revalidatePath(scopedPath(basePath, "/settings"));
  return { ok: true, message: "保存しました。" };
}
