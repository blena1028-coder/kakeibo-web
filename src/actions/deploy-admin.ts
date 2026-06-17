"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const adminCookieName = "kakeibo_deploy_admin";

function getDeployAdminCredentials() {
  return {
    id: process.env.DEPLOY_ADMIN_ID?.trim() ?? "",
    password: process.env.DEPLOY_ADMIN_PASSWORD ?? ""
  };
}

export async function loginDeployAdmin(formData: FormData) {
  const id = String(formData.get("admin_id") ?? "");
  const password = String(formData.get("admin_password") ?? "");
  const admin = getDeployAdminCredentials();

  if (!admin.id || !admin.password || id !== admin.id || password !== admin.password) {
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
