"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readHouseholdMembers, readHouseholds, writeHouseholdMembers, writeHouseholds } from "@/lib/csv";
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

function createHouseholdUrlId(existingIds: Set<string>) {
  for (let index = 0; index < 8; index += 1) {
    const id = `hh-${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
    if (!existingIds.has(id)) return id;
  }
  return `hh-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export async function createHousehold(formData: FormData) {
  const name = String(formData.get("household_name") ?? "").trim().slice(0, 20);
  if (!name) redirect("/deploy?error=name");

  const now = new Date().toISOString();
  const households = await readHouseholds();
  const id = createHouseholdUrlId(new Set(households.map((household) => household.id)));

  await writeHouseholds([
    ...households,
    {
      id,
      name,
      created_at: now,
      updated_at: now
    }
  ]);

  const members = await readHouseholdMembers();
  await writeHouseholdMembers([
    ...members,
    {
      id: `member-${id}-a`,
      household_id: id,
      user_id: "A",
      display_name: "A",
      role: "owner",
      created_at: now,
      updated_at: now
    },
    {
      id: `member-${id}-b`,
      household_id: id,
      user_id: "B",
      display_name: "B",
      role: "member",
      created_at: now,
      updated_at: now
    }
  ]);

  revalidatePath(`/${id}`);
  redirect(`/${id}`);
}
