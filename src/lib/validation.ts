import type { MemberId, TransactionFormState } from "@/lib/types";

export type ParsedTransactionInput = {
  id?: string;
  date: string;
  amount: number;
  category_id: string;
  memo: string;
  payer_ids: MemberId[];
  created_by: MemberId;
};

export function parseTransactionForm(formData: FormData): {
  value?: ParsedTransactionInput;
  state?: TransactionFormState;
} {
  const id = String(formData.get("id") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const amount = Number(amountRaw);
  const category_id = String(formData.get("category_id") ?? "").trim();
  const memo = String(formData.get("memo") ?? "").trim().slice(0, 200);
  const payer_ids = formData
    .getAll("payer_ids")
    .map(String)
    .filter((value): value is MemberId => value === "A" || value === "B");
  const created_by = String(formData.get("created_by") ?? "A") === "B" ? "B" : "A";
  const errors: Record<string, string> = {};

  if (!date) errors.date = "日付を入力してください";
  if (!amountRaw || Number.isNaN(amount) || amount <= 0) {
    errors.amount = "金額は1円以上で入力してください";
  } else if (amount > 99999999) {
    errors.amount = "金額は8桁以内で入力してください";
  }
  if (payer_ids.length === 0) errors.payer_ids = "負担者を選択してください";

  if (Object.keys(errors).length > 0) {
    return {
      state: {
        ok: false,
        message: "入力内容を確認してください",
        errors
      }
    };
  }

  return {
    value: {
      id: id || undefined,
      date,
      amount,
      category_id,
      memo,
      payer_ids,
      created_by
    }
  };
}
