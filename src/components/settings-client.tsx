"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { deleteCategory, reorderCategories, updateCategories } from "@/actions/categories";
import { updateHouseholdName } from "@/actions/households";
import { updateMemberNames } from "@/actions/members";
import { deleteQuickTemplate, reorderQuickTemplates, updateQuickTemplates } from "@/actions/quick-templates";
import { formatYen } from "@/lib/date";
import { memberName } from "@/lib/members";
import type { Category, MemberId, MemberNameMap, QuickTemplate, SettingsActionState } from "@/lib/types";

type Props = {
  categories: Category[];
  categoryUsage: Record<string, { transactions: number; templates: number }>;
  memberNames: MemberNameMap;
  templates: QuickTemplate[];
  householdId: string;
  basePath: string;
  householdName: string;
};

type CategoryEditor = Category | "new" | null;
type TemplateEditor = QuickTemplate | "new" | null;

const initialState: SettingsActionState = { ok: false, message: "" };

export function SettingsClient({ categories, categoryUsage, memberNames, templates, householdId, basePath, householdName }: Props) {
  const [householdState, householdAction] = useActionState(updateHouseholdName, initialState);
  const [memberState, memberAction] = useActionState(updateMemberNames, initialState);
  const [categoryState, categoryAction] = useActionState(updateCategories, initialState);
  const [categoryOrderState, categoryOrderAction] = useActionState(reorderCategories, initialState);
  const [categoryDeleteState, categoryDeleteAction] = useActionState(deleteCategory, initialState);
  const [templateState, templateAction] = useActionState(updateQuickTemplates, initialState);
  const [templateOrderState, templateOrderAction] = useActionState(reorderQuickTemplates, initialState);
  const [templateDeleteState, templateDeleteAction] = useActionState(deleteQuickTemplate, initialState);
  const [toast, setToast] = useState<SettingsActionState>(initialState);
  const [householdEditorOpen, setHouseholdEditorOpen] = useState(false);
  const [memberEditorOpen, setMemberEditorOpen] = useState(false);
  const [categoryEditor, setCategoryEditor] = useState<CategoryEditor>(null);
  const [categoryOrder, setCategoryOrder] = useState(categories);
  const [categoryDeleteTarget, setCategoryDeleteTarget] = useState<Category | null>(null);
  const [categoryDangerConfirmOpen, setCategoryDangerConfirmOpen] = useState(false);
  const [templateEditor, setTemplateEditor] = useState<TemplateEditor>(null);
  const [templateOrder, setTemplateOrder] = useState(templates);
  const [templateDeleteTarget, setTemplateDeleteTarget] = useState<QuickTemplate | null>(null);
  const latestState = useMemo(
    () => [householdState, memberState, categoryState, categoryOrderState, categoryDeleteState, templateState, templateOrderState, templateDeleteState].findLast((state) => state.message),
    [householdState, memberState, categoryState, categoryOrderState, categoryDeleteState, templateState, templateOrderState, templateDeleteState]
  );

  useEffect(() => setCategoryOrder(categories), [categories]);
  useEffect(() => setTemplateOrder(templates), [templates]);

  useEffect(() => {
    if (!latestState?.message) return;
    setToast(latestState);
    if (latestState.ok) {
      setHouseholdEditorOpen(false);
      setMemberEditorOpen(false);
      setCategoryEditor(null);
      setCategoryDeleteTarget(null);
      setCategoryDangerConfirmOpen(false);
      setTemplateEditor(null);
      setTemplateDeleteTarget(null);
    }
    const timer = window.setTimeout(() => setToast(initialState), 2600);
    return () => window.clearTimeout(timer);
  }, [latestState]);

  return (
    <>
      <section className="panel compact-panel">
        <div className="settings-heading">
          <h2>領域名</h2>
          <button className="tiny-icon-button" aria-label="領域名を編集" onClick={() => setHouseholdEditorOpen(true)} type="button">
            <Pencil aria-hidden size={18} />
          </button>
        </div>
        <div className="settings-chip-scroll">
          <span className="chip strong-chip">{householdName || "共有"}</span>
        </div>
      </section>

      <section className="panel compact-panel">
        <div className="settings-heading">
          <h2>メンバー名</h2>
          <button className="tiny-icon-button" aria-label="メンバー名を編集" onClick={() => setMemberEditorOpen(true)} type="button">
            <Pencil aria-hidden size={18} />
          </button>
        </div>
        <div className="settings-chip-scroll">
          <span className="chip strong-chip">{memberNames.A}</span>
          <span className="chip strong-chip accent-chip">{memberNames.B}</span>
        </div>
      </section>

      <section className="panel compact-panel">
        <div className="settings-heading">
          <h2>カテゴリー</h2>
          <button className="tiny-icon-button add" aria-label="カテゴリーを追加" onClick={() => setCategoryEditor("new")} type="button">
            <Plus aria-hidden size={20} />
          </button>
        </div>
        <div className="settings-chip-scroll">
          {categoryOrder.map((category, index) => (
            <div className="sortable-item" key={category.id}>
              <button className="sort-nudge" aria-label={`${category.name}を左へ移動`} disabled={index === 0} onClick={() => setCategoryOrder(moveItem(categoryOrder, index, index - 1))} type="button">
                <ChevronLeft aria-hidden size={16} />
              </button>
              <button className="category-pill" onClick={() => setCategoryEditor(category)} type="button">
                {category.name}
              </button>
              <button className="sort-nudge" aria-label={`${category.name}を右へ移動`} disabled={index === categoryOrder.length - 1} onClick={() => setCategoryOrder(moveItem(categoryOrder, index, index + 1))} type="button">
                <ChevronRight aria-hidden size={16} />
              </button>
            </div>
          ))}
        </div>
        <form action={categoryOrderAction} className="sort-save-form">
          <input name="household_id" type="hidden" value={householdId} />
          <input name="base_path" type="hidden" value={basePath} />
          {categoryOrder.map((category) => (
            <input key={category.id} name="category_order" type="hidden" value={category.id} />
          ))}
          <button className="sort-save-button" type="submit">並び順を保存</button>
        </form>
      </section>

      <section className="panel compact-panel">
        <div className="settings-heading">
          <h2>よく使う入力(ショートカット)</h2>
          <button className="tiny-icon-button add" aria-label="よく使う入力(ショートカット)を追加" onClick={() => setTemplateEditor("new")} type="button">
            <Plus aria-hidden size={20} />
          </button>
        </div>
        <div className="template-card-scroll">
          {templateOrder.map((template, index) => (
            <div className="sortable-template" key={template.id}>
              <div className="sort-controls">
                <button className="sort-nudge" aria-label={`${template.label}を左へ移動`} disabled={index === 0} onClick={() => setTemplateOrder(moveItem(templateOrder, index, index - 1))} type="button">
                  <ChevronLeft aria-hidden size={16} />
                </button>
                <button className="sort-nudge" aria-label={`${template.label}を右へ移動`} disabled={index === templateOrder.length - 1} onClick={() => setTemplateOrder(moveItem(templateOrder, index, index + 1))} type="button">
                  <ChevronRight aria-hidden size={16} />
                </button>
              </div>
              <button className="template-summary-card" onClick={() => setTemplateEditor(template)} type="button">
                <strong>{template.label}</strong>
                <small>{template.amount > 0 ? formatYen(template.amount) : "金額なし"}</small>
                <span>{template.memo || "内容なし"}</span>
              </button>
            </div>
          ))}
        </div>
        <form action={templateOrderAction} className="sort-save-form">
          <input name="household_id" type="hidden" value={householdId} />
          <input name="base_path" type="hidden" value={basePath} />
          {templateOrder.map((template) => (
            <input key={template.id} name="template_order" type="hidden" value={template.id} />
          ))}
          <button className="sort-save-button" type="submit">並び順を保存</button>
        </form>
      </section>

      {householdEditorOpen ? (
        <SettingsModal title="領域名" onClose={() => setHouseholdEditorOpen(false)}>
          <form action={householdAction} className="settings-form">
            <input name="household_id" type="hidden" value={householdId} />
            <input name="base_path" type="hidden" value={basePath} />
            <label>
              <span>領域名</span>
              <input name="household_name" defaultValue={householdName} maxLength={20} onInput={(event) => limitInput(event, 20)} />
            </label>
            <SaveButton />
          </form>
        </SettingsModal>
      ) : null}

      {memberEditorOpen ? (
        <SettingsModal title="メンバー名" onClose={() => setMemberEditorOpen(false)}>
          <form action={memberAction} className="settings-form">
            <input name="household_id" type="hidden" value={householdId} />
            <input name="base_path" type="hidden" value={basePath} />
            <label>
              <span>Aの表示名</span>
              <input name="member_A" defaultValue={memberNames.A} maxLength={20} />
            </label>
            <label>
              <span>Bの表示名</span>
              <input name="member_B" defaultValue={memberNames.B} maxLength={20} />
            </label>
            <SaveButton />
          </form>
        </SettingsModal>
      ) : null}

      {categoryEditor ? (
        <SettingsModal title={categoryEditor === "new" ? "カテゴリー追加" : "カテゴリー編集"} onClose={() => setCategoryEditor(null)}>
          <form action={categoryAction} className="settings-form">
            <input name="household_id" type="hidden" value={householdId} />
            <input name="base_path" type="hidden" value={basePath} />
            {categoryEditor === "new" ? (
              <label>
                <span>カテゴリー名</span>
                <input name="new_category_name" onInput={(event) => limitInput(event, 10)} placeholder="例：交通費" maxLength={10} />
              </label>
            ) : (
              <label>
                <span>カテゴリー名</span>
                <input name={`category_${categoryEditor.id}_name`} defaultValue={categoryEditor.name} onInput={(event) => limitInput(event, 10)} maxLength={10} />
                <input name="category_ids" type="hidden" value={categoryEditor.id} />
                <input name="category_id" type="hidden" value={categoryEditor.id} />
              </label>
            )}
            <div className="settings-action-row">
              {categoryEditor !== "new" ? (
                <button className="icon-text danger settings-delete" onClick={() => setCategoryDeleteTarget(categoryEditor)} type="button">
                  <Trash2 aria-hidden size={18} />
                  削除
                </button>
              ) : null}
              <SaveButton />
            </div>
          </form>
        </SettingsModal>
      ) : null}

      {categoryDeleteTarget && !categoryDangerConfirmOpen ? (
        <SettingsModal title="カテゴリー削除" onClose={() => setCategoryDeleteTarget(null)}>
          <div className="settings-form">
            <input name="category_id" type="hidden" value={categoryDeleteTarget.id} />
            <p className="warning-text">削除しますか？</p>
            <p className="warning-text">このカテゴリーを削除します。</p>
            <div className="settings-action-row">
              <button
                className="icon-text danger settings-delete"
                onClick={() => {
                  const usage = categoryUsage[categoryDeleteTarget.id];
                  if ((usage?.transactions ?? 0) + (usage?.templates ?? 0) > 0) {
                    setCategoryDangerConfirmOpen(true);
                    return;
                  }
                  const form = document.getElementById("category-delete-form") as HTMLFormElement | null;
                  form?.requestSubmit();
                }}
                type="button"
              >
                <Trash2 aria-hidden size={18} />
                はい
              </button>
              <button className="icon-text primary settings-submit" onClick={() => {
                setCategoryDeleteTarget(null);
                setCategoryDangerConfirmOpen(false);
              }} type="button">
                いいえ
              </button>
            </div>
          </div>
          <form action={categoryDeleteAction} id="category-delete-form">
            <input name="category_id" type="hidden" value={categoryDeleteTarget.id} />
            <input name="household_id" type="hidden" value={householdId} />
            <input name="base_path" type="hidden" value={basePath} />
          </form>
        </SettingsModal>
      ) : null}

      {categoryDeleteTarget && categoryDangerConfirmOpen ? (
        <SettingsModal title="注意: 未分類になります" onClose={() => {
          setCategoryDeleteTarget(null);
          setCategoryDangerConfirmOpen(false);
        }}>
          <form action={categoryDeleteAction} className="settings-form">
            <input name="category_id" type="hidden" value={categoryDeleteTarget.id} />
            <input name="household_id" type="hidden" value={householdId} />
            <input name="base_path" type="hidden" value={basePath} />
            <p className="warning-text">
              このカテゴリーは履歴またはよく使う入力(ショートカット)で使われています。
            </p>
            <p className="warning-text">
              削除すると該当データはすべて未分類になります。元に戻せません。
            </p>
            <div className="settings-action-row">
              <button className="icon-text danger settings-delete" type="submit">
                <Trash2 aria-hidden size={18} />
                それでも削除
              </button>
              <button className="icon-text primary settings-submit" onClick={() => {
                setCategoryDeleteTarget(null);
                setCategoryDangerConfirmOpen(false);
              }} type="button">
                いいえ
              </button>
            </div>
          </form>
        </SettingsModal>
      ) : null}

      {templateEditor ? (
        <SettingsModal title={templateEditor === "new" ? "よく使う入力(ショートカット)追加" : "よく使う入力(ショートカット)編集"} onClose={() => setTemplateEditor(null)}>
          <form action={templateAction} className="settings-form template-settings">
            <input name="household_id" type="hidden" value={householdId} />
            <input name="base_path" type="hidden" value={basePath} />
            <TemplateFields
              categories={categories}
              memberNames={memberNames}
              template={templateEditor}
            />
            <div className="settings-action-row">
              {templateEditor !== "new" ? (
                <>
                  <button className="icon-text danger settings-delete" onClick={() => setTemplateDeleteTarget(templateEditor)} type="button">
                    <Trash2 aria-hidden size={18} />
                    削除
                  </button>
                </>
              ) : null}
              <SaveButton />
            </div>
          </form>
        </SettingsModal>
      ) : null}

      {templateDeleteTarget ? (
        <SettingsModal title="削除しますか？" onClose={() => setTemplateDeleteTarget(null)}>
          <form action={templateDeleteAction} className="settings-form">
            <input name="template_id" type="hidden" value={templateDeleteTarget.id} />
            <input name="household_id" type="hidden" value={householdId} />
            <input name="base_path" type="hidden" value={basePath} />
            <p className="warning-text">このショートカットを削除します。履歴には影響しません。</p>
            <div className="settings-action-row">
              <button className="icon-text danger settings-delete" type="submit">
                <Trash2 aria-hidden size={18} />
                はい
              </button>
              <button className="icon-text primary settings-submit" onClick={() => setTemplateDeleteTarget(null)} type="button">
                いいえ
              </button>
            </div>
          </form>
        </SettingsModal>
      ) : null}

      {toast.message ? (
        <div className={toast.ok ? "toast show" : "toast show error"} role="status">
          {toast.message}
        </div>
      ) : null}
    </>
  );
}

function TemplateFields({
  categories,
  memberNames,
  template
}: {
  categories: Category[];
  memberNames: MemberNameMap;
  template: QuickTemplate | "new";
}) {
  const prefix = template === "new" ? "new_template" : `template_${template.id}`;
  const selectedPayers = template === "new" ? (["A", "B"] as MemberId[]) : template.payer_ids;

  return (
    <fieldset className="template-editor">
      <legend>{template === "new" ? "新規追加" : template.label}</legend>
      {template !== "new" ? <input name="template_ids" type="hidden" value={template.id} /> : null}

      <div className="template-edit-grid">
        <label>
          <span>ショートカット名</span>
          <input name={`${prefix}_label`} defaultValue={template === "new" ? "" : template.label} onInput={(event) => limitInput(event, 10)} maxLength={10} />
        </label>

        <label>
          <span>金額</span>
          <input
            inputMode="numeric"
            max="99999999"
            min="0"
            name={`${prefix}_amount`}
            onInput={(event) => limitNumberInput(event, 8)}
            type="number"
            defaultValue={template === "new" ? "" : template.amount}
          />
        </label>
      </div>

      <label>
        <span>カテゴリー</span>
        <select name={`${prefix}_category_id`} defaultValue={template === "new" ? "" : template.category_id}>
          <option value="">未分類</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </label>

      <label>
        <span>内容</span>
        <textarea name={`${prefix}_memo`} defaultValue={template === "new" ? "" : template.memo} onInput={(event) => limitInput(event, 120)} maxLength={120} rows={2} />
      </label>

      <fieldset className="settings-payer-field">
        <legend>負担者</legend>
        {(["A", "B"] as MemberId[]).map((id) => (
          <label className="settings-check" key={id}>
            <input
              defaultChecked={selectedPayers.includes(id)}
              name={`${prefix}_payer_ids`}
              type="checkbox"
              value={id}
            />
            {memberName(memberNames, id)}
          </label>
        ))}
      </fieldset>
    </fieldset>
  );
}

function limitInput(event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, maxLength: number) {
  const target = event.currentTarget;
  if (target.value.length > maxLength) target.value = target.value.slice(0, maxLength);
}

function limitNumberInput(event: React.FormEvent<HTMLInputElement>, maxDigits: number) {
  const target = event.currentTarget;
  const digits = target.value.replace(/\D/g, "").slice(0, maxDigits);
  if (target.value !== digits) target.value = digits;
}

function moveItem<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function SettingsModal({
  children,
  onClose,
  title
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-modal="true" className="modal-sheet settings-modal" role="dialog">
        <header className="modal-header">
          <h2>{title}</h2>
          <button aria-label="閉じる" className="icon-button" onClick={onClose} type="button">
            <X aria-hidden size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function SaveButton() {
  return (
    <button className="icon-text primary settings-submit" type="submit">
      <Save aria-hidden size={18} />
      保存
    </button>
  );
}
