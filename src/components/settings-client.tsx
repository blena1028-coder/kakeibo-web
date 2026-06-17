"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, GripVertical, Pencil, Plus, Save, Trash2, X } from "lucide-react";
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
type OrderEditor = "categories" | "templates" | null;

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
  const [draggingCategoryId, setDraggingCategoryId] = useState("");
  const [categoryDeleteTarget, setCategoryDeleteTarget] = useState<Category | null>(null);
  const [categoryDangerConfirmOpen, setCategoryDangerConfirmOpen] = useState(false);
  const [templateEditor, setTemplateEditor] = useState<TemplateEditor>(null);
  const [templateOrder, setTemplateOrder] = useState(templates);
  const [draggingTemplateId, setDraggingTemplateId] = useState("");
  const [templateDeleteTarget, setTemplateDeleteTarget] = useState<QuickTemplate | null>(null);
  const [orderEditor, setOrderEditor] = useState<OrderEditor>(null);
  const [publicUrl, setPublicUrl] = useState(basePath || "/");
  const [urlCopied, setUrlCopied] = useState(false);
  const categoryRowRefs = useRef(new Map<string, HTMLDivElement>());
  const templateRowRefs = useRef(new Map<string, HTMLDivElement>());
  const handledActionStates = useRef(new WeakSet<SettingsActionState>());
  const actionStates = useMemo(
    () => [householdState, memberState, categoryState, categoryOrderState, categoryDeleteState, templateState, templateOrderState, templateDeleteState],
    [householdState, memberState, categoryState, categoryOrderState, categoryDeleteState, templateState, templateOrderState, templateDeleteState]
  );

  useEffect(() => setCategoryOrder(categories), [categories]);
  useEffect(() => setTemplateOrder(templates), [templates]);
  useEffect(() => setPublicUrl(`${window.location.origin}${basePath || "/"}`), [basePath]);
  useEffect(() => {
    if (!urlCopied) return;
    const timer = window.setTimeout(() => setUrlCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [urlCopied]);

  useEffect(() => {
    const latestState = actionStates.findLast((state) => state.message && !handledActionStates.current.has(state));
    if (!latestState) return;
    handledActionStates.current.add(latestState);
    setToast(latestState);
    if (latestState.ok) {
      setHouseholdEditorOpen(false);
      setMemberEditorOpen(false);
      setCategoryEditor(null);
      setCategoryDeleteTarget(null);
      setCategoryDangerConfirmOpen(false);
      setTemplateEditor(null);
      setTemplateDeleteTarget(null);
      setOrderEditor(null);
      setDraggingCategoryId("");
      setDraggingTemplateId("");
    }
    const timer = window.setTimeout(() => setToast(initialState), 2600);
    return () => window.clearTimeout(timer);
  }, [actionStates]);

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
          <h2>領域URL</h2>
        </div>
        <div className="settings-url-row">
          <div className="settings-url-box">
          <code>{publicUrl}</code>
          </div>
          <button className="tiny-icon-button" aria-label="領域URLをコピー" onClick={async () => {
            const copied = await copyText(publicUrl);
            if (copied) setUrlCopied(true);
          }} type="button">
            {urlCopied ? <Check aria-hidden size={18} /> : <Copy aria-hidden size={18} />}
          </button>
        </div>
        {urlCopied ? <p className="copy-status">コピー済み</p> : null}
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
          <div className="settings-heading-actions">
            <button className="sort-open-button" onClick={() => setOrderEditor("categories")} type="button">並べ替え</button>
            <button className="tiny-icon-button add" aria-label="カテゴリーを追加" onClick={() => setCategoryEditor("new")} type="button">
              <Plus aria-hidden size={20} />
            </button>
          </div>
        </div>
        <div className="settings-chip-scroll">
          {categories.map((category) => (
            <button className="category-pill" key={category.id} onClick={() => setCategoryEditor(category)} type="button">
              {category.name}
            </button>
          ))}
        </div>
      </section>

      <section className="panel compact-panel">
        <div className="settings-heading">
          <h2>よく使う入力(ショートカット)</h2>
          <div className="settings-heading-actions">
            <button className="sort-open-button" onClick={() => setOrderEditor("templates")} type="button">並べ替え</button>
            <button className="tiny-icon-button add" aria-label="よく使う入力(ショートカット)を追加" onClick={() => setTemplateEditor("new")} type="button">
              <Plus aria-hidden size={20} />
            </button>
          </div>
        </div>
        <div className="template-card-scroll">
          {templates.map((template) => (
            <button className="template-summary-card" key={template.id} onClick={() => setTemplateEditor(template)} type="button">
              <strong>{template.label}</strong>
              <small>{template.amount > 0 ? formatYen(template.amount) : "金額なし"}</small>
              <span>{template.memo || "内容なし"}</span>
            </button>
          ))}
        </div>
      </section>

      {orderEditor === "categories" ? (
        <SettingsModal title="カテゴリー並べ替え" onClose={() => {
          setCategoryOrder(categories);
          setOrderEditor(null);
        }}>
          <form action={categoryOrderAction} className="settings-form">
            <input name="household_id" type="hidden" value={householdId} />
            <input name="base_path" type="hidden" value={basePath} />
            <div className="reorder-list">
              {categoryOrder.map((category) => (
                <div
                  className={draggingCategoryId === category.id ? "reorder-row dragging" : "reorder-row"}
                  key={category.id}
                  ref={(node) => setRowRef(categoryRowRefs.current, category.id, node)}
                >
                  <span>{category.name}</span>
                  <button
                    className="drag-handle"
                    aria-label={`${category.name}を並べ替え`}
                    onPointerDown={(event) => {
                      event.currentTarget.setPointerCapture(event.pointerId);
                      setDraggingCategoryId(category.id);
                    }}
                    onPointerMove={(event) => {
                      if (!draggingCategoryId) return;
                      event.preventDefault();
                      setCategoryOrder((current) => reorderByPointer(current, draggingCategoryId, event.clientY, categoryRowRefs.current));
                    }}
                    onPointerUp={() => setDraggingCategoryId("")}
                    type="button"
                  >
                    <GripVertical aria-hidden size={22} />
                  </button>
                  <input name="category_order" type="hidden" value={category.id} />
                </div>
              ))}
            </div>
            <SaveButton label="決定" />
          </form>
        </SettingsModal>
      ) : null}

      {orderEditor === "templates" ? (
        <SettingsModal title="ショートカット並べ替え" onClose={() => {
          setTemplateOrder(templates);
          setOrderEditor(null);
        }}>
          <form action={templateOrderAction} className="settings-form">
            <input name="household_id" type="hidden" value={householdId} />
            <input name="base_path" type="hidden" value={basePath} />
            <div className="reorder-list">
              {templateOrder.map((template) => (
                <div
                  className={draggingTemplateId === template.id ? "reorder-row dragging" : "reorder-row"}
                  key={template.id}
                  ref={(node) => setRowRef(templateRowRefs.current, template.id, node)}
                >
                  <span>{template.label}</span>
                  <button
                    className="drag-handle"
                    aria-label={`${template.label}を並べ替え`}
                    onPointerDown={(event) => {
                      event.currentTarget.setPointerCapture(event.pointerId);
                      setDraggingTemplateId(template.id);
                    }}
                    onPointerMove={(event) => {
                      if (!draggingTemplateId) return;
                      event.preventDefault();
                      setTemplateOrder((current) => reorderByPointer(current, draggingTemplateId, event.clientY, templateRowRefs.current));
                    }}
                    onPointerUp={() => setDraggingTemplateId("")}
                    type="button"
                  >
                    <GripVertical aria-hidden size={22} />
                  </button>
                  <input name="template_order" type="hidden" value={template.id} />
                </div>
              ))}
            </div>
            <SaveButton label="決定" />
          </form>
        </SettingsModal>
      ) : null}

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
          <form
            action={categoryDeleteAction}
            className="settings-form"
            onSubmit={() => {
              setCategoryDeleteTarget(null);
              setCategoryDangerConfirmOpen(false);
            }}
          >
            <input name="category_id" type="hidden" value={categoryDeleteTarget.id} />
            <input name="household_id" type="hidden" value={householdId} />
            <input name="base_path" type="hidden" value={basePath} />
            <p className="warning-text">
              このカテゴリーは履歴またはよく使う入力(ショートカット)で使われています。
            </p>
            <p className="warning-text">
              削除すると未締めの履歴とショートカットは未分類になります。締め済み履歴のデータは変更しません。
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

async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back below for non-secure HTTP contexts.
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  return copied;
}

function setRowRef(refs: Map<string, HTMLDivElement>, id: string, node: HTMLDivElement | null) {
  if (node) refs.set(id, node);
  else refs.delete(id);
}

function reorderByPointer<T extends { id: string }>(items: T[], activeId: string, clientY: number, refs: Map<string, HTMLDivElement>) {
  const from = items.findIndex((item) => item.id === activeId);
  if (from < 0) return items;
  const to = items.findIndex((item) => {
    if (item.id === activeId) return false;
    const rect = refs.get(item.id)?.getBoundingClientRect();
    if (!rect) return false;
    return clientY >= rect.top && clientY <= rect.bottom;
  });
  if (to < 0 || to === from) return items;
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

function SaveButton({ label = "保存" }: { label?: string }) {
  return (
    <button className="icon-text primary settings-submit" type="submit">
      <Save aria-hidden size={18} />
      {label}
    </button>
  );
}
