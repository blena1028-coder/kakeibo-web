"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Save, Trash2, X } from "lucide-react";
import { deleteTransaction, saveTransaction } from "@/actions/transactions";
import { todayInputValue } from "@/lib/date";
import { memberName } from "@/lib/members";
import type { Category, MemberId, MemberNameMap, QuickTemplate, Transaction, TransactionFormState } from "@/lib/types";

type Draft = {
  date: string;
  amount: string;
  category_id: string;
  memo: string;
  payer_ids: MemberId[];
  created_by: MemberId;
};

type Props = {
  categories: Category[];
  memberNames: MemberNameMap;
  templates: QuickTemplate[];
  householdId: string;
  basePath: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onSaved?: (message: string) => void;
  editTransaction?: Transaction | null;
  pickedTemplate?: QuickTemplate | null;
};

const initialState: TransactionFormState = { ok: false, message: "" };

function emptyDraft(): Draft {
  return {
    date: todayInputValue(),
    amount: "",
    category_id: "",
    memo: "",
    payer_ids: ["A", "B"],
    created_by: "A"
  };
}

export function InputModal({ categories, memberNames, templates, householdId, basePath, open, setOpen, onSaved, editTransaction, pickedTemplate }: Props) {
  const [state, formAction] = useActionState(saveTransaction, initialState);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const handledSuccessState = useRef<TransactionFormState | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editTransaction) {
      setDraft({
        date: editTransaction.date,
        amount: String(editTransaction.amount),
        category_id: editTransaction.category_id,
        memo: editTransaction.memo,
        payer_ids: editTransaction.payer_ids,
        created_by: editTransaction.created_by
      });
    } else if (pickedTemplate) {
      setDraft({
        date: todayInputValue(),
        amount: pickedTemplate.amount > 0 ? String(pickedTemplate.amount) : "",
        category_id: pickedTemplate.category_id,
        memo: pickedTemplate.memo,
        payer_ids: pickedTemplate.payer_ids,
        created_by: "A"
      });
    } else {
      setDraft(emptyDraft());
    }
  }, [editTransaction, open, pickedTemplate]);

  useEffect(() => {
    if (!state.ok || !state.message || handledSuccessState.current === state) return;
    handledSuccessState.current = state;
    setDraft(emptyDraft());
    setDeleteConfirmOpen(false);
    setOpen(false);
    onSaved?.("保存しました。");
  }, [onSaved, setOpen, state.message, state.ok]);

  const title = editTransaction ? "履歴編集" : "入力";
  const errorText = useMemo(() => Object.values(state.errors ?? {}).join(" / "), [state.errors]);

  if (!open) return null;

  function closeModal() {
    setDeleteConfirmOpen(false);
    setOpen(false);
  }

  function togglePayer(id: MemberId) {
    setDraft((current) => ({
      ...current,
      payer_ids: current.payer_ids.includes(id)
        ? current.payer_ids.filter((payer) => payer !== id)
        : [...current.payer_ids, id].sort() as MemberId[]
    }));
  }

  function applyTemplate(template: QuickTemplate) {
    setDraft({
      date: todayInputValue(),
      amount: template.amount > 0 ? String(template.amount) : "",
      category_id: template.category_id,
      memo: template.memo,
      payer_ids: template.payer_ids,
      created_by: "A"
    });
  }

  return (
    <div className="modal-backdrop" role="presentation">
      {deleteConfirmOpen && editTransaction ? (
        <section aria-modal="true" className="modal-sheet settings-modal" role="dialog">
          <header className="modal-header">
            <h2>削除しますか？</h2>
            <button aria-label="閉じる" className="icon-button" onClick={() => setDeleteConfirmOpen(false)} type="button">
              <X aria-hidden size={20} />
            </button>
          </header>
          <form action={deleteTransaction} className="settings-form">
            <input name="id" type="hidden" value={editTransaction.id} />
            <input name="household_id" type="hidden" value={householdId} />
            <input name="base_path" type="hidden" value={basePath} />
            <p className="warning-text">この履歴を削除します。元に戻せません。</p>
            <div className="settings-action-row">
              <button className="icon-text danger settings-delete" type="submit">
                <Trash2 aria-hidden size={18} />
                はい
              </button>
              <button className="icon-text primary settings-submit" onClick={() => setDeleteConfirmOpen(false)} type="button">
                いいえ
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section aria-modal="true" className="modal-sheet" role="dialog">
        <header className="modal-header">
          <h2>{title}</h2>
          <button aria-label="閉じる" className="icon-button" onClick={closeModal} type="button">
            <X aria-hidden size={20} />
          </button>
        </header>

        <div className="template-strip">
          {templates.map((template) => (
            <button key={template.id} onClick={() => applyTemplate(template)} type="button">
              {template.label}
            </button>
          ))}
        </div>

        <form action={formAction} className="form-grid" id="transaction-form">
          <input name="id" type="hidden" value={editTransaction?.id ?? ""} />
          <input name="household_id" type="hidden" value={householdId} />
          <input name="base_path" type="hidden" value={basePath} />
          <label>
            <span>日付</span>
            <input name="date" onChange={(event) => setDraft({ ...draft, date: event.target.value })} type="date" value={draft.date} />
          </label>

          <label>
            <span>金額</span>
            <input inputMode="numeric" max="99999999" min="1" name="amount" onChange={(event) => setDraft({ ...draft, amount: event.target.value })} placeholder="0" type="number" value={draft.amount} />
          </label>

          <label>
            <span>カテゴリー</span>
            <select name="category_id" onChange={(event) => setDraft({ ...draft, category_id: event.target.value })} value={draft.category_id}>
              <option value="">未分類</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>

          <label>
            <span>支払者</span>
            <select name="created_by" onChange={(event) => setDraft({ ...draft, created_by: event.target.value as MemberId })} value={draft.created_by}>
              <option value="A">{memberName(memberNames, "A")}</option>
              <option value="B">{memberName(memberNames, "B")}</option>
            </select>
          </label>

          <label className="wide-field">
            <span>内容</span>
            <textarea name="memo" maxLength={200} onChange={(event) => setDraft({ ...draft, memo: event.target.value.slice(0, 200) })} rows={3} value={draft.memo} />
          </label>

          <fieldset className="payer-field">
            <legend>負担者</legend>
            {(["A", "B"] as MemberId[]).map((id) => (
              <label className={draft.payer_ids.includes(id) ? "payer-chip selected" : "payer-chip"} key={id}>
                <input
                  checked={draft.payer_ids.includes(id)}
                  name="payer_ids"
                  onChange={() => togglePayer(id)}
                  type="checkbox"
                  value={id}
                />
                {memberName(memberNames, id)}
              </label>
            ))}
          </fieldset>

          {errorText ? <p className="form-error">{errorText}</p> : null}
          <div className="settings-action-row wide-field">
            {editTransaction ? (
              <button className="icon-text danger settings-delete" onClick={() => setDeleteConfirmOpen(true)} type="button">
                <Trash2 aria-hidden size={18} />
                削除
              </button>
            ) : null}
            <TransactionSaveButton />
          </div>
        </form>
      </section>
      )}
    </div>
  );
}

function TransactionSaveButton() {
  const { pending } = useFormStatus();
  return (
    <button className="icon-text primary settings-submit" disabled={pending} type="submit">
      <Save aria-hidden size={18} />
      {pending ? "保存中" : "保存"}
    </button>
  );
}
