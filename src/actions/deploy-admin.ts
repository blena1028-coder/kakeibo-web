"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const adminCookieName = "kakeibo_deploy_admin";

export async function loginDeployAdmin(formData: FormData) {
  const id = String(formData.get("admin_id") ?? "");
  const password = String(formData.get("admin_password") ?? "");

  if (id !== "admin" || password !== "0000") {
    redirect("/deploy/admin?error=auth");
  }

  const cookieStore = await cookies();
  cookieStore.set(adminCookieName, "1", {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    path: "/deploy",
    sameSite: "lax"
  });

  redirect("/deploy/admin");
}

export async function logoutDeployAdmin() {
  const cookieStore = await cookies();
  cookieStore.set(adminCookieName, "", {
    maxAge: 0,
    path: "/deploy"
  });
  redirect("/deploy/admin");
}

export async function isDeployAdminLoggedIn() {
  const cookieStore = await cookies();
  return cookieStore.get(adminCookieName)?.value === "1";
}
