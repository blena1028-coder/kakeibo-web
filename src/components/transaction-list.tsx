import { formatShortDate, formatYen } from "@/lib/date";
import { memberName, payerNames } from "@/lib/members";
import type { Category, MemberNameMap, Transaction } from "@/lib/types";

type Props = {
  categories: Category[];
  memberNames: MemberNameMap;
  transactions: Transaction[];
};

export function TransactionList({ categories, memberNames, transactions }: Props) {
  const categoryName = (id: string) => categories.find((category) => category.id === id)?.name ?? "未分類";

  if (transactions.length === 0) {
    return <p className="empty-text">履歴はありません</p>;
  }

  return (
    <div className="stack-list">
      {transactions.map((tx) => (
        <div className="mini-row" key={tx.id}>
          <span className="date-badge">{formatShortDate(tx.date)}</span>
          <span>
            <strong>{tx.memo || categoryName(tx.category_id)}</strong>
            <small>支払者: {memberName(memberNames, tx.created_by)} / 負担者: {payerNames(memberNames, tx.payer_ids)}</small>
          </span>
          <b>{formatYen(tx.amount)}</b>
        </div>
      ))}
    </div>
  );
}
