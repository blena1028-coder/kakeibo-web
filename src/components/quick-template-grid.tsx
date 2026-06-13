"use client";

import { ReceiptText } from "lucide-react";
import type { Category, MemberNameMap, QuickTemplate } from "@/lib/types";
import { formatYen } from "@/lib/date";

type Props = {
  categories: Category[];
  memberNames: MemberNameMap;
  templates: QuickTemplate[];
  onPick: (template: QuickTemplate) => void;
};

export function QuickTemplateGrid({ categories, memberNames, templates, onPick }: Props) {
  void categories;
  void memberNames;

  return (
    <section className="panel">
      <h2>よく使う入力(ショートカット)</h2>
      <div className="template-grid">
        {templates.map((template) => (
          <button className="template-card" key={template.id} onClick={() => onPick(template)} type="button">
            <ReceiptText aria-hidden size={18} />
            <span>{template.label}</span>
            <small>{template.amount > 0 ? formatYen(template.amount) : "金額なし"} / {template.memo || "内容なし"}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
