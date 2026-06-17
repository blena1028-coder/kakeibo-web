"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Lock, WalletCards } from "lucide-react";
import { closeMonth, recordSettlementPayment } from "@/actions/monthly";
import { InputModal } from "@/components/input-modal";
import { currentMonthKey, formatShortDate, formatYen } from "@/lib/date";
import { memberName, payerNames } from "@/lib/members";
import { calculateSettlement, filterAdjustmentsThisMonth, filterThisMonth, isMonthClosed, latestClosedMonth } from "@/lib/settlement";
import type { Category, MemberNameMap, MonthlyAdjustment, MonthlyClosing, QuickTemplate, SettingsActionState, Transaction } from "@/lib/types";

type Props = {
  transactions: Transaction[];
  categories: Category[];
  templates: QuickTemplate[];
  memberNames: MemberNameMap;
  householdId: string;
  basePath: string;
  closings: MonthlyClosing[];
  adjustments: MonthlyAdjustment[];
};

const initialActionState: SettingsActionState = { ok: false, message: "" };

export function HistoryClient({ transactions, categories, templates, memberNames, householdId, basePath, closings, adjustments }: Props) {
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [toast, setToast] = useState("");
  const [closeState, closeAction] = useActionState(closeMonth, initialActionState);
  const [paymentState, paymentAction] = useActionState(recordSettlementPayment, initialActionState);
  const categoryName = (id: string) => categories.find((category) => category.id === id)?.name ?? "未分類";
  const months = Array.from(new Set([
    ...transactions.map((tx) => tx.date.slice(0, 7)),
    ...adjustments.map((adjustment) => adjustment.month),
    currentMonthKey()
  ])).sort((a, b) => b.localeCompare(a));
  const actionMonth = selectedMonth === "all" ? months[0] ?? currentMonthKey() : selectedMonth;
  const latestClosed = latestClosedMonth(closings);
  const actionMonthClosed = isMonthClosed(actionMonth, closings);
  const actionSettlement = useMemo(
    () => calculateSettlement(
      filterThisMonth(transactions, actionMonth),
      memberNames,
      filterAdjustmentsThisMonth(adjustments, actionMonth)
    ),
    [actionMonth, adjustments, memberNames, transactions]
  );
  const actionMonthAdjustments = adjustments.filter((adjustment) => adjustment.month === actionMonth);
  const filteredTransactions = transactions.filter((tx) => {
    const monthMatches = selectedMonth === "all" || tx.date.startsWith(selectedMonth);
    const categoryMatches = selectedCategory === "all" || tx.category_id === selectedCategory;
    return monthMatches && categoryMatches;
  });

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!closeState.message) return;
    setToast(closeState.message);
  }, [closeState]);

  useEffect(() => {
    if (!paymentState.message) return;
    setToast(paymentState.message);
  }, [paymentState]);

  function openTransaction(tx: Transaction) {
    if (isMonthClosed(tx.date.slice(0, 7), closings)) {
      setToast("月締め済みの履歴は編集・削除できません。");
      return;
    }
    setEditing(tx);
  }

  return (
    <main className="space-y-5">
      <header>
        <p className="eyebrow">History</p>
        <h1>履歴</h1>
      </header>

      <section className="panel monthly-panel">
        <div className="settings-heading">
          <div>
            <h2>月締め・精算</h2>
            <p className="panel-note">締め済み月の履歴は編集・削除できません。</p>
          </div>
          {latestClosed ? <span className="closed-badge">締め済み: {latestClosed}まで</span> : <span className="closed-badge">未締め</span>}
        </div>
        <div className="monthly-grid">
          <form action={closeAction} className="monthly-card">
            <input name="household_id" type="hidden" value={householdId} />
            <input name="base_path" type="hidden" value={basePath} />
            <label>
              <span>対象月</span>
              <select name="month" value={actionMonth} onChange={(event) => setSelectedMonth(event.target.value)}>
                {months.map((month) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </label>
            <strong>{actionSettlement.settlementText}</strong>
            <MonthlySubmitButton disabled={actionMonthClosed} label={actionMonthClosed ? "締め済み" : "月締め"} />
          </form>

          <form action={paymentAction} className="monthly-card">
            <input name="household_id" type="hidden" value={householdId} />
            <input name="base_path" type="hidden" value={basePath} />
            <input name="month" type="hidden" value={actionMonth} />
            <label>
              <span>精算した金額</span>
              <input inputMode="numeric" min="1" name="amount" placeholder="0" type="number" />
            </label>
            <small>対象月: {actionMonth} / {actionSettlement.settlementText}</small>
            <MonthlySubmitButton disabled={!actionSettlement.fromMember || actionSettlement.settlementFloor <= 0} label="精算" />
          </form>
        </div>
        {actionMonthAdjustments.length > 0 ? (
          <div className="adjustment-list">
            {actionMonthAdjustments.map((adjustment) => (
              <span key={adjustment.id}>
                {adjustment.kind === "carryover" ? "繰越" : "精算"}: {formatYen(Math.abs(adjustment.amount_signed))}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section className="history-filters" aria-label="履歴フィルタ">
        <select aria-label="月で絞り込み" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}>
          <option value="all">すべての月</option>
          {months.map((month) => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
        <select aria-label="カテゴリーで絞り込み" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
          <option value="all">すべてのカテゴリー</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </section>

      <section className="history-list">
        {filteredTransactions.map((tx) => (
          <button className={isMonthClosed(tx.date.slice(0, 7), closings) ? "history-row locked" : "history-row"} key={tx.id} onClick={() => openTransaction(tx)} type="button">
            <span className="date-badge">{formatShortDate(tx.date)}</span>
            <span className="history-main">
              <strong>{tx.memo || categoryName(tx.category_id)}</strong>
              <small>{categoryName(tx.category_id)} / 支払者: {memberName(memberNames, tx.created_by)} / 負担者: {payerNames(memberNames, tx.payer_ids)}</small>
            </span>
            {isMonthClosed(tx.date.slice(0, 7), closings) ? <span className="lock-chip"><Lock aria-hidden size={14} />締め済み</span> : null}
            <span className="history-amount">{formatYen(tx.amount)}</span>
          </button>
        ))}
        {filteredTransactions.length === 0 ? <p className="empty-text">条件に合う履歴はありません</p> : null}
      </section>

      <InputModal
        categories={categories}
        householdId={householdId}
        basePath={basePath}
        editTransaction={editing}
        memberNames={memberNames}
        onSaved={setToast}
        open={Boolean(editing)}
        setOpen={(value) => {
          if (!value) setEditing(null);
        }}
        templates={templates}
      />
      {toast ? (
        <div className="toast show" role="status">
          {toast}
        </div>
      ) : null}
    </main>
  );
}

function MonthlySubmitButton({ disabled, label }: { disabled?: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="icon-text primary settings-submit" disabled={pending || disabled} type="submit">
      <WalletCards aria-hidden size={18} />
      {pending ? "処理中" : label}
    </button>
  );
}
