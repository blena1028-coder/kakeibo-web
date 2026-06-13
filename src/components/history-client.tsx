"use client";

import { useState } from "react";
import { InputModal } from "@/components/input-modal";
import { formatShortDate, formatYen } from "@/lib/date";
import { memberName, payerNames } from "@/lib/members";
import type { Category, MemberNameMap, QuickTemplate, Transaction } from "@/lib/types";

type Props = {
  transactions: Transaction[];
  categories: Category[];
  templates: QuickTemplate[];
  memberNames: MemberNameMap;
  householdId: string;
  basePath: string;
};

export function HistoryClient({ transactions, categories, templates, memberNames, householdId, basePath }: Props) {
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const categoryName = (id: string) => categories.find((category) => category.id === id)?.name ?? "未分類";
  const months = Array.from(new Set(transactions.map((tx) => tx.date.slice(0, 7)))).sort((a, b) => b.localeCompare(a));
  const filteredTransactions = transactions.filter((tx) => {
    const monthMatches = selectedMonth === "all" || tx.date.startsWith(selectedMonth);
    const categoryMatches = selectedCategory === "all" || tx.category_id === selectedCategory;
    return monthMatches && categoryMatches;
  });

  return (
    <main className="space-y-5">
      <header>
        <p className="eyebrow">History</p>
        <h1>履歴</h1>
      </header>

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
          <button className="history-row" key={tx.id} onClick={() => setEditing(tx)} type="button">
            <span className="date-badge">{formatShortDate(tx.date)}</span>
            <span className="history-main">
              <strong>{tx.memo || categoryName(tx.category_id)}</strong>
              <small>{categoryName(tx.category_id)} / 支払者: {memberName(memberNames, tx.created_by)} / 負担者: {payerNames(memberNames, tx.payer_ids)}</small>
            </span>
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
        open={Boolean(editing)}
        setOpen={(value) => {
          if (!value) setEditing(null);
        }}
        templates={templates}
      />
    </main>
  );
}
