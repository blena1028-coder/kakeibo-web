import { headers } from "next/headers";
import { loginDeployAdmin, logoutDeployAdmin, isDeployAdminLoggedIn } from "@/actions/deploy-admin";
import { readHouseholds } from "@/lib/csv";
import { householdBasePath } from "@/lib/households";

export const dynamic = "force-dynamic";

function urlFor(origin: string, householdId: string) {
  const path = householdBasePath(householdId);
  return `${origin}${path || "/"}`;
}

async function requestOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "";
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

export default async function DeployAdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const loggedIn = await isDeployAdminLoggedIn();
  const hasAuthError = params.error === "auth";
  const origin = await requestOrigin();
  const households = loggedIn ? await readHouseholds() : [];

  return (
    <main className="deploy-page">
      <section className="panel deploy-panel">
        <p className="eyebrow">Deploy Admin</p>
        <h1>領域展開 管理画面</h1>

        {loggedIn ? (
          <>
            <div className="settings-heading">
              <h2>領域一覧</h2>
              <form action={logoutDeployAdmin}>
                <button className="sort-open-button" type="submit">
                  ログアウト
                </button>
              </form>
            </div>
            <div className="admin-area-list">
              {households.map((household) => (
                <div className="admin-area-row" key={household.id}>
                  <strong>{household.name || household.id}</strong>
                  <code>{urlFor(origin, household.id)}</code>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="deploy-lead">管理用IDとパスワードを入力してください。</p>
            <form action={loginDeployAdmin} className="settings-form">
              <label>
                <span>ID</span>
                <input autoComplete="username" name="admin_id" required />
              </label>
              <label>
                <span>パスワード</span>
                <input autoComplete="current-password" name="admin_password" required type="password" />
              </label>
              {hasAuthError ? <p className="form-error">IDまたはパスワードが違います。</p> : null}
              <button className="icon-text primary settings-submit" type="submit">
                ログイン
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
