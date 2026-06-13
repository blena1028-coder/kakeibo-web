export type MemberId = "A" | "B";

export type Transaction = {
  id: string;
  household_id: string;
  date: string;
  amount: number;
  category_id: string;
  memo: string;
  payer_ids: MemberId[];
  created_by: MemberId;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  household_id: string;
  name: string;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type QuickTemplate = {
  id: string;
  household_id: string;
  label: string;
  amount: number;
  category_id: string;
  memo: string;
  payer_ids: MemberId[];
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type HouseholdMember = {
  id: string;
  household_id: string;
  user_id: MemberId;
  display_name: string;
  role: string;
  created_at: string;
  updated_at: string;
};

export type Household = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: MemberId;
  display_name: string;
  email: string;
  created_at: string;
  updated_at: string;
};

export type MemberNameMap = Record<MemberId, string>;

export type TransactionFormState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
};

export type SettingsActionState = {
  ok: boolean;
  message: string;
};

export type Settlement = {
  total: number;
  aBurden: number;
  bBurden: number;
  difference: number;
  settlementAmount: number;
  settlementText: string;
};
