import { createHousehold } from "@/actions/households";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DeployPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const hasRequiredError = params.error === "required";

  return (
    <main className="deploy-page">
      <section className="panel deploy-panel">
        <p className="eyebrow">Deploy</p>
        <h1>領域展開</h1>
        <p className="deploy-lead">
          新しい共有家計簿の領域を作成します。領域名とメンバー名は画面表示用で、URLには推測されにくいランダムIDを発行します。
        </p>

        <form action={createHousehold} className="settings-form">
          <label>
            <span>領域名</span>
            <input
              aria-describedby={hasRequiredError ? "deploy-error" : undefined}
              autoComplete="off"
              maxLength={20}
              name="household_name"
              placeholder="例：山田家"
              required
            />
          </label>
          <label>
            <span>メンバーA</span>
            <input autoComplete="off" maxLength={20} name="member_A" placeholder="例：太郎" required />
          </label>
          <label>
            <span>メンバーB</span>
            <input autoComplete="off" maxLength={20} name="member_B" placeholder="例：花子" required />
          </label>
          {hasRequiredError ? (
            <p className="form-error" id="deploy-error">
              領域名、メンバーA、メンバーBを入力してください。
            </p>
          ) : null}
          <button className="icon-text primary settings-submit" type="submit">
            領域を作成
          </button>
        </form>
      </section>

      <section className="panel deploy-panel">
        <h2>管理画面</h2>
        <p className="deploy-lead">
          作成済み領域のURLを確認できます。URLを忘れた場合の確認用です。
        </p>
        <Link className="icon-text primary settings-submit" href="/deploy/admin">
          管理画面を開く
        </Link>
      </section>
    </main>
  );
}
