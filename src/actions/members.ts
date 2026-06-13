"use server";

import { revalidatePath } from "next/cache";
import { readHouseholdMembers, writeHouseholdMembers } from "@/lib/csv";
import { defaultHouseholdId } from "@/lib/households";
import type { MemberId, SettingsActionState } from "@/lib/types";

function cleanName(value: FormDataEntryValue | null, fallback: MemberId) {
  const text = String(value ?? "").trim();
  return text || fallback;
}

export async function updateMemberNames(
  _previousState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const householdId = String(formData.get("household_id") ?? defaultHouseholdId);
  const basePath = String(formData.get("base_path") ?? "");
  const names: Record<MemberId, string> = {
    A: cleanName(formData.get("member_A"), "A"),
    B: cleanName(formData.get("member_B"), "B")
  };
  const now = new Date().toISOString();

  const members = await readHouseholdMembers(householdId);
  await writeHouseholdMembers(
    members.map((member) => ({
      ...member,
      display_name: names[member.user_id],
      updated_at: now
    })),
    householdId
  );

  revalidatePath(basePath || "/");
  revalidatePath(`${basePath}/history`);
  revalidatePath(`${basePath}/analytics`);
  revalidatePath(`${basePath}/settings`);

  return { ok: true, message: "保存しました。" };
}
