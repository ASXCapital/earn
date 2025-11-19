import type { Address } from "viem";
import { getContract } from "thirdweb";
import {
  acceptedOfferEvent,
  newAuctionEvent,
  newBidEvent,
  newListingEvent,
  newOfferEvent,
  newSaleEvent,
} from "thirdweb/extensions/marketplace";

import { client } from "@/lib/thirdweb";
import { MARKETPLACE_V3_ADDRESS, MARKETPLACE_V3_CHAIN } from "@/marketplace/config";

export const MARKETPLACE_LISTING_CURRENCY =
  "0x49eaB1FDb59cBCf3B55C20Fa7FC88c34E0B31060" as Address;

export const EVENT_FILTERS = [
  newListingEvent(),
  newSaleEvent(),
  newAuctionEvent(),
  newBidEvent(),
  newOfferEvent(),
  acceptedOfferEvent(),
] as const;

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const ACTIVITY_BLOCK_WINDOWS: readonly bigint[] = [4_000n, 2_000n, 1_000n];

export const MAX_ROLE_MEMBERS = 50;

export const MARKETPLACE_CONTRACT = getContract({
  client,
  chain: MARKETPLACE_V3_CHAIN,
  address: MARKETPLACE_V3_ADDRESS as Address,
});

export type MarketplaceContract = ReturnType<typeof getContract>;
