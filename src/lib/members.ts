import type { HouseholdMember, MemberId, MemberNameMap } from "@/lib/types";

export const defaultMemberNames: MemberNameMap = {
  A: "A",
  B: "B"
};

export function buildMemberNameMap(members: HouseholdMember[]): MemberNameMap {
  return members.reduce<MemberNameMap>(
    (acc, member) => {
      acc[member.user_id] = member.display_name || member.user_id;
      return acc;
    },
    { ...defaultMemberNames }
  );
}

export function memberName(memberNames: MemberNameMap, id: MemberId) {
  return memberNames[id] || id;
}

export function payerNames(memberNames: MemberNameMap, ids: MemberId[]) {
  return ids.map((id) => memberName(memberNames, id)).join("・");
}
