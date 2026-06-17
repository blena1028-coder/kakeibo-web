import { headers } from "next/headers";
import { createBugReport } from "@/actions/bug-reports";
import { loginDeployAdmin, logoutDeployAdmin, isDeployAdminLoggedIn } from "@/actions/deploy-admin";
import { readBugReports, readHouseholds } from "@/lib/csv";
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

export default async function DeployAdminPage({ searchParams }: { searchParams: Promise<{ bug?: string; error?: string }> }) {
  const params = await searchParams;
  const loggedIn = await isDeployAdminLoggedIn();
  const hasAuthError = params.error === "auth";
  const hasBugTitleError = params.error === "bug-title";
  const isBugSaved = params.bug === "saved";
  const origin = await requestOrigin();
  const households = loggedIn ? await readHouseholds() : [];
  const bugReports = loggedIn ? await readBugReports() : [];

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

            <div className="library-section">
              <h2>ライブラリ</h2>
              <div className="library-grid">
                <a className="library-card" href="/library/system-manual.docx">
                  <strong>システムマニュアル</strong>
                  <span>仕様、運用、Git/AWS管理の資料</span>
                </a>
                <a className="library-card" href="/library/user-manual.docx">
                  <strong>ユーザーマニュアル</strong>
                  <span>利用者向けの操作説明</span>
                </a>
                <a className="library-card" href="/library/bug-report-template.csv">
                  <strong>バグ記録テンプレート</strong>
                  <span>外部で記録したい場合のCSV雛形</span>
                </a>
              </div>
            </div>

            <div className="library-section">
              <h2>テスト結果・バグ記録</h2>
              {isBugSaved ? <p className="form-success">バグ記録を保存しました。</p> : null}
              <form action={createBugReport} className="settings-form bug-report-form">
                <label>
                  <span>タイトル</span>
                  <input name="title" placeholder="例: カテゴリー削除後に表示が残る" required />
                </label>
                <div className="form-grid-2">
                  <label>
                    <span>重要度</span>
                    <select name="severity" defaultValue="中">
                      <option>高</option>
                      <option>中</option>
                      <option>低</option>
                    </select>
                  </label>
                  <label>
                    <span>状態</span>
                    <select name="status" defaultValue="未対応">
                      <option>未対応</option>
                      <option>調査中</option>
                      <option>修正済み</option>
                      <option>保留</option>
                    </select>
                  </label>
                </div>
                <label>
                  <span>対象画面・領域</span>
                  <input name="area" placeholder="例: /tanaka/settings カテゴリー削除" />
                </label>
                <label>
                  <span>再現手順</span>
                  <textarea name="steps" rows={4} placeholder="1. 画面を開く&#10;2. クリック・入力する&#10;3. 保存する" />
                </label>
                <div className="form-grid-2">
                  <label>
                    <span>期待結果</span>
                    <textarea name="expected" rows={3} />
                  </label>
                  <label>
                    <span>実際の結果</span>
                    <textarea name="actual" rows={3} />
                  </label>
                </div>
                <div className="form-grid-2">
                  <label>
                    <span>原因候補</span>
                    <textarea name="cause" rows={3} />
                  </label>
                  <label>
                    <span>修正案</span>
                    <textarea name="fix" rows={3} />
                  </label>
                </div>
                {hasBugTitleError ? <p className="form-error">タイトルを入力してください。</p> : null}
                <button className="icon-text primary settings-submit" type="submit">
                  バグ記録を保存
                </button>
              </form>

              <div className="admin-area-list">
                {bugReports.length > 0 ? (
                  bugReports.map((report) => (
                    <div className="admin-area-row bug-report-row" key={report.id}>
                      <div className="bug-report-title">
                        <strong>{report.title}</strong>
                        <span>{report.severity} / {report.status}</span>
                      </div>
                      <code>{report.area || "対象未設定"} / {new Date(report.updated_at).toLocaleString("ja-JP")}</code>
                      <p>{report.actual || report.steps || "詳細未入力"}</p>
                    </div>
                  ))
                ) : (
                  <div className="admin-area-row">
                    <strong>保存済みのバグ記録はありません。</strong>
                    <code>テストで不具合が出たら、この場所に保存します。</code>
                  </div>
                )}
              </div>
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
