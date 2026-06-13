"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { InputModal } from "@/components/input-modal";
import { QuickTemplateGrid } from "@/components/quick-template-grid";
import { TransactionList } from "@/components/transaction-list";
import { formatYen } from "@/lib/date";
import type { Category, MemberNameMap, QuickTemplate, Settlement, Transaction } from "@/lib/types";

type Props = {
  categories: Category[];
  memberNames: MemberNameMap;
  templates: QuickTemplate[];
  transactions: Transaction[];
  settlement: Settlement;
  householdId: string;
  basePath: string;
  householdTitle: string;
};

export function HomeClient({ categories, memberNames, templates, transactions, settlement, householdId, basePath, householdTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [pickedTemplate, setPickedTemplate] = useState<QuickTemplate | null>(null);

  return (
    <main className="space-y-5">
      <header className="home-hero">
        <div>
          <p className="eyebrow">Kakeibo</p>
          <h1>{householdTitle}</h1>
        </div>
        <button className="round-button" aria-label="入力" onClick={() => setOpen(true)} type="button">
          <Plus aria-hidden size={24} />
        </button>
      </header>

      <section className="total-band">
        <span>今月の支出</span>
        <strong>{formatYen(settlement.total)}</strong>
      </section>

      <section className="summary-grid">
        <div className="metric">
          <span>{memberNames.A}の負担</span>
          <strong>{formatYen(settlement.aBurden)}</strong>
        </div>
        <div className="metric accent">
          <span>{memberNames.B}の負担</span>
          <strong>{formatYen(settlement.bBurden)}</strong>
        </div>
      </section>

      <section className="settlement-band">
        <span>精算目安</span>
        <strong>{settlement.settlementText}</strong>
      </section>

      <QuickTemplateGrid
        categories={categories}
        memberNames={memberNames}
        templates={templates}
        onPick={(template) => {
          setPickedTemplate(template);
          setOpen(true);
        }}
      />

      <section className="panel">
        <h2>最近の履歴</h2>
        <TransactionList categories={categories} memberNames={memberNames} transactions={transactions} />
      </section>

      <InputModal
        categories={categories}
        householdId={householdId}
        basePath={basePath}
        memberNames={memberNames}
        pickedTemplate={pickedTemplate}
        open={open}
        setOpen={(value) => {
          setOpen(value);
          if (!value) setPickedTemplate(null);
        }}
        templates={templates}
      />
    </main>
  );
}
