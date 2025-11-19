import { getRoleMember, getRoleMemberCount } from "thirdweb/extensions/permissions";

import {
  MARKETPLACE_CONTRACT,
  MAX_ROLE_MEMBERS,
  ZERO_ADDRESS,
} from "@/components/marketplace/constants";

export async function fetchRoleMembersFromChain(
  role: string,
  maxMembers = MAX_ROLE_MEMBERS,
): Promise<string[]> {
  try {
    const count = await getRoleMemberCount({
      contract: MARKETPLACE_CONTRACT,
      role,
    });
    if (!count || count === 0n) {
      return [];
    }
    const limitedCount = Number(count > BigInt(maxMembers) ? BigInt(maxMembers) : count);
    const memberAddresses = await Promise.all(
      Array.from({ length: limitedCount }).map((_, index) =>
        getRoleMember({
          contract: MARKETPLACE_CONTRACT,
          role,
          index: BigInt(index),
        }),
      ),
    );
    return memberAddresses
      .map((address) => address?.toLowerCase?.() ?? address?.toString?.() ?? "")
      .filter((address): address is string => Boolean(address) && address !== ZERO_ADDRESS);
  } catch (err) {
    console.debug(`Unable to enumerate ${role} role members`, err);
    return [];
  }
}
