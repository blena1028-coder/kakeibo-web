export const defaultHouseholdId = "household-main";

const householdSlugMap: Record<string, string> = {
  tanaka: "household-tanaka",
  kobayashi: "household-kobayashi",
  test: "household-test",
  main: defaultHouseholdId
};

export function householdIdFromSlug(slug?: string) {
  if (!slug) return defaultHouseholdId;
  return householdSlugMap[slug] ?? slug;
}

export function householdSlugFromId(householdId = defaultHouseholdId) {
  const entry = Object.entries(householdSlugMap).find(([, id]) => id === householdId);
  if (!entry || entry[0] === "main") return "";
  return entry[0];
}

export function householdBasePath(householdId = defaultHouseholdId) {
  const slug = householdSlugFromId(householdId);
  return slug ? `/${slug}` : "";
}

export function householdNameOrSlug(householdId: string, storedName?: string) {
  const trimmedName = storedName?.trim();
  if (trimmedName) return trimmedName;
  return householdSlugFromId(householdId);
}

export function householdTitle(householdName: string) {
  return householdName ? `${householdName} 共有家計簿` : "共有家計簿";
}

export function scopedPath(basePath: string, path: string) {
  if (!basePath) return path;
  if (path === "/") return basePath;
  return `${basePath}${path}`;
}
