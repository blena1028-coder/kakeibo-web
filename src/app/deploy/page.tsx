import { createHousehold } from "@/actions/households";

export const dynamic = "force-dynamic";

export default async function DeployPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const hasNameError = params.error === "name";

  return (
    <main className="deploy-page">
      <section className="panel deploy-panel">
        <p className="eyebrow">Deploy</p>
        <h1>領域展開</h1>
        <p className="deploy-lead">
          新しい共有家計簿の領域を作成します。領域名は画面表示用で、URLには推測されにくいランダムIDを発行します。
        </p>

        <form action={createHousehold} className="settings-form">
          <label>
            <span>領域名</span>
            <input
              aria-describedby={hasNameError ? "deploy-error" : undefined}
              autoComplete="off"
              maxLength={20}
              name="household_name"
              placeholder="例：山田家"
            />
          </label>
          {hasNameError ? (
            <p className="form-error" id="deploy-error">
              領域名を入力してください。
            </p>
          ) : null}
          <button className="icon-text primary settings-submit" type="submit">
            領域を作成
          </button>
        </form>
      </section>
    </main>
  );
}
