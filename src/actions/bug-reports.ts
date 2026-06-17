"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isDeployAdminLoggedIn } from "@/actions/deploy-admin";
import { readBugReports, writeBugReports } from "@/lib/csv";

function text(formData: FormData, name: string, maxLength: number) {
  return String(formData.get(name) ?? "").trim().slice(0, maxLength);
}

export async function createBugReport(formData: FormData) {
  if (!(await isDeployAdminLoggedIn())) redirect("/deploy/admin");

  const title = text(formData, "title", 80);
  if (!title) redirect("/deploy/admin?error=bug-title");

  const now = new Date().toISOString();
  const reports = await readBugReports();

  await writeBugReports([
    {
      id: `bug-${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`,
      title,
      severity: text(formData, "severity", 20) || "中",
      area: text(formData, "area", 80),
      steps: text(formData, "steps", 1000),
      expected: text(formData, "expected", 500),
      actual: text(formData, "actual", 500),
      cause: text(formData, "cause", 500),
      fix: text(formData, "fix", 500),
      status: text(formData, "status", 20) || "未対応",
      created_at: now,
      updated_at: now
    },
    ...reports
  ]);

  revalidatePath("/deploy/admin");
  redirect("/deploy/admin?bug=saved");
}
