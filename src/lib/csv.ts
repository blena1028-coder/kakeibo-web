import { promises as fs } from "fs";
import path from "path";
import type { BugReport, Category, Household, HouseholdMember, MemberId, QuickTemplate, Transaction, User } from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");

type Row = Record<string, string>;

const files = {
  transactions: "transactions.csv",
  categories: "categories.csv",
  quickTemplates: "quick_templates.csv",
  households: "households.csv",
  householdMembers: "household_members.csv",
  users: "users.csv",
  bugReports: "bug_reports.csv"
};

function parseCsv(text: string): Row[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      field = "";
      row = [];
      continue;
    }
    field += char;
  }

  row.push(field);
  if (row.some((value) => value.length > 0)) rows.push(row);

  const [headers, ...body] = rows;
  if (!headers) return [];
  return body.map((values) =>
    headers.reduce<Row>((acc, header, index) => {
      acc[header] = values[index] ?? "";
      return acc;
    }, {})
  );
}

function escapeCsv(value: string | number) {
  const text = String(value ?? "");
  if (!/[",\r\n]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

function stringifyCsv(headers: string[], rows: Row[]) {
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header] ?? "")).join(","))
  ].join("\n");
}

async function readRows(fileName: string) {
  const text = await fs.readFile(path.join(dataDir, fileName), "utf8");
  return parseCsv(text);
}

async function writeRows(fileName: string, headers: string[], rows: Row[]) {
  await fs.writeFile(path.join(dataDir, fileName), `${stringifyCsv(headers, rows)}\n`, "utf8");
}

function parsePayers(value: string): MemberId[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is MemberId => item === "A" || item === "B");
  } catch {
    return [];
  }
}

function parseMember(value: string): MemberId {
  return value === "B" ? "B" : "A";
}

export async function readTransactions(householdId?: string): Promise<Transaction[]> {
  const rows = await readRows(files.transactions);
  return rows
    .filter((row) => !householdId || row.household_id === householdId)
    .map((row) => ({
      id: row.id,
      household_id: row.household_id,
      date: row.date,
      amount: Number(row.amount),
      category_id: row.category_id,
      memo: row.memo,
      payer_ids: parsePayers(row.payer_ids),
      created_by: parseMember(row.created_by),
      created_at: row.created_at,
      updated_at: row.updated_at
    }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.updated_at.localeCompare(a.updated_at));
}

export async function writeTransactions(transactions: Transaction[], householdId?: string) {
  const nextTransactions = householdId
    ? [
        ...(await readTransactions()).filter((tx) => tx.household_id !== householdId),
        ...transactions
      ]
    : transactions;
  await writeRows(
    files.transactions,
    ["id", "household_id", "date", "amount", "category_id", "memo", "payer_ids", "created_by", "created_at", "updated_at"],
    nextTransactions.map((tx) => ({
      ...tx,
      amount: String(tx.amount),
      payer_ids: JSON.stringify(tx.payer_ids)
    }))
  );
}

export async function readCategories(householdId?: string): Promise<Category[]> {
  const rows = await readRows(files.categories);
  return rows
    .filter((row) => !householdId || row.household_id === householdId)
    .map((row) => ({
      id: row.id,
      household_id: row.household_id,
      name: row.name,
      icon: row.icon,
      sort_order: Number(row.sort_order),
      created_at: row.created_at,
      updated_at: row.updated_at
    }))
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function writeCategories(categories: Category[], householdId?: string) {
  const nextCategories = householdId
    ? [
        ...(await readCategories()).filter((category) => category.household_id !== householdId),
        ...categories
      ]
    : categories;
  await writeRows(
    files.categories,
    ["id", "household_id", "name", "icon", "sort_order", "created_at", "updated_at"],
    nextCategories.map((category) => ({
      ...category,
      sort_order: String(category.sort_order)
    }))
  );
}

export async function readQuickTemplates(householdId?: string): Promise<QuickTemplate[]> {
  const rows = await readRows(files.quickTemplates);
  return rows
    .filter((row) => !householdId || row.household_id === householdId)
    .map((row) => ({
      id: row.id,
      household_id: row.household_id,
      label: row.label,
      amount: Number(row.amount),
      category_id: row.category_id,
      memo: row.memo,
      payer_ids: parsePayers(row.payer_ids),
      sort_order: Number(row.sort_order),
      created_at: row.created_at,
      updated_at: row.updated_at
    }))
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function writeQuickTemplates(templates: QuickTemplate[], householdId?: string) {
  const nextTemplates = householdId
    ? [
        ...(await readQuickTemplates()).filter((template) => template.household_id !== householdId),
        ...templates
      ]
    : templates;
  await writeRows(
    files.quickTemplates,
    ["id", "household_id", "label", "amount", "category_id", "memo", "payer_ids", "sort_order", "created_at", "updated_at"],
    nextTemplates.map((template) => ({
      ...template,
      amount: String(template.amount),
      payer_ids: JSON.stringify(template.payer_ids),
      sort_order: String(template.sort_order)
    }))
  );
}

export async function readHouseholdMembers(householdId?: string): Promise<HouseholdMember[]> {
  const rows = await readRows(files.householdMembers);
  return rows.filter((row) => !householdId || row.household_id === householdId).map((row) => ({
    id: row.id,
    household_id: row.household_id,
    user_id: parseMember(row.user_id),
    display_name: row.display_name,
    role: row.role,
    created_at: row.created_at,
    updated_at: row.updated_at
  }));
}

export async function writeHouseholdMembers(members: HouseholdMember[], householdId?: string) {
  const nextMembers = householdId
    ? [
        ...(await readHouseholdMembers()).filter((member) => member.household_id !== householdId),
        ...members
      ]
    : members;
  await writeRows(
    files.householdMembers,
    ["id", "household_id", "user_id", "display_name", "role", "created_at", "updated_at"],
    nextMembers.map((member) => ({ ...member }))
  );
}

export async function readHouseholds(): Promise<Household[]> {
  const rows = await readRows(files.households);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    created_at: row.created_at,
    updated_at: row.updated_at
  }));
}

export async function writeHouseholds(households: Household[]) {
  await writeRows(
    files.households,
    ["id", "name", "created_at", "updated_at"],
    households.map((household) => ({ ...household }))
  );
}

export async function readUsers(): Promise<User[]> {
  const rows = await readRows(files.users);
  return rows.map((row) => ({
    id: parseMember(row.id),
    display_name: row.display_name,
    email: row.email,
    created_at: row.created_at,
    updated_at: row.updated_at
  }));
}

export async function writeUsers(users: User[]) {
  await writeRows(
    files.users,
    ["id", "display_name", "email", "created_at", "updated_at"],
    users.map((user) => ({ ...user }))
  );
}

export async function readBugReports(): Promise<BugReport[]> {
  const rows = await readRows(files.bugReports);
  return rows
    .map((row) => ({
      id: row.id,
      title: row.title,
      severity: row.severity,
      area: row.area,
      steps: row.steps,
      expected: row.expected,
      actual: row.actual,
      cause: row.cause,
      fix: row.fix,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    }))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function writeBugReports(reports: BugReport[]) {
  await writeRows(
    files.bugReports,
    ["id", "title", "severity", "area", "steps", "expected", "actual", "cause", "fix", "status", "created_at", "updated_at"],
    reports.map((report) => ({ ...report }))
  );
}

export async function readRawCsv(fileName: string) {
  return fs.readFile(path.join(dataDir, fileName), "utf8");
}
