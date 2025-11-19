import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

import {
  AcceptedOffer as AcceptedOfferEvent,
  AuctionClosed as AuctionClosedEvent,
  CancelledListing as CancelledListingEvent,
  CancelledOffer as CancelledOfferEvent,
  NewAuction as NewAuctionEvent,
  NewBid as NewBidEvent,
  NewListing as NewListingEvent,
  NewOffer as NewOfferEvent,
  NewSale as NewSaleEvent,
  UpdatedListing as UpdatedListingEvent,
} from "../generated/MarketplaceV3/MarketplaceV3";
import {
  Auction,
  Bid,
  Listing,
  MarketplaceEvent,
  Offer,
  Sale,
} from "../generated/schema";

const STATUS_MAP = [
  "UNSET",
  "CREATED",
  "COMPLETED",
  "CANCELLED",
  "ACTIVE",
  "EXPIRED",
];

function mapStatus(value: i32, fallback: string = "UNKNOWN"): string {
  return value >= 0 && value < STATUS_MAP.length ? STATUS_MAP[value] : fallback;
}

function eventId(event: ethereum.Event): string {
  return (
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
}

function recordEvent(
  event: ethereum.Event,
  kind: string,
  listing: Listing | null = null,
  auction: Auction | null = null,
  offer: Offer | null = null,
  actor: Address | null = null,
  metadata: string | null = null,
): void {
  const entity = new MarketplaceEvent(eventId(event));
  entity.kind = kind;
  entity.txHash = event.transaction.hash;
  entity.logIndex = event.logIndex;
  entity.blockNumber = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.listing = listing ? listing.id : null;
  entity.auction = auction ? auction.id : null;
  entity.offer = offer ? offer.id : null;
  entity.actor = actor;
  entity.metadata = metadata;
  entity.save();
}

function getOrCreateListing(
  listingId: BigInt,
  event: ethereum.Event,
): Listing {
  let listing = Listing.load(listingId.toString());
  if (listing === null) {
    listing = new Listing(listingId.toString());
    listing.listingId = listingId;
    listing.createdAt = event.block.timestamp;
  }
  listing.updatedAt = event.block.timestamp;
  return listing as Listing;
}

function getOrCreateAuction(
  auctionId: BigInt,
  event: ethereum.Event,
): Auction {
  let auction = Auction.load(auctionId.toString());
  if (auction === null) {
    auction = new Auction(auctionId.toString());
    auction.auctionId = auctionId;
    auction.createdAt = event.block.timestamp;
  }
  auction.updatedAt = event.block.timestamp;
  return auction as Auction;
}

function getOrCreateOffer(offerId: BigInt, event: ethereum.Event): Offer {
  let offer = Offer.load(offerId.toString());
  if (offer === null) {
    offer = new Offer(offerId.toString());
    offer.offerId = offerId;
    offer.createdAt = event.block.timestamp;
  }
  offer.updatedAt = event.block.timestamp;
  return offer as Offer;
}

export function handleNewListing(event: NewListingEvent): void {
  const payload = event.params.listing;
  const listing = getOrCreateListing(payload.listingId, event);
  listing.creator = payload.listingCreator;
  listing.assetContract = payload.assetContract;
  listing.tokenId = payload.tokenId;
  listing.quantity = payload.quantity;
  listing.pricePerToken = payload.pricePerToken;
  listing.currency = payload.currency;
  listing.startTimestamp = BigInt.fromI32(payload.startTimestamp.toI32());
  listing.endTimestamp = BigInt.fromI32(payload.endTimestamp.toI32());
  listing.reserved = payload.reserved;
  listing.status = mapStatus(payload.status);
  listing.save();

  recordEvent(event, "NEW_LISTING", listing, null, null, payload.listingCreator);
}

export function handleUpdatedListing(event: UpdatedListingEvent): void {
  const payload = event.params.listing;
  const listing = getOrCreateListing(payload.listingId, event);
  listing.pricePerToken = payload.pricePerToken;
  listing.quantity = payload.quantity;
  listing.startTimestamp = BigInt.fromI32(payload.startTimestamp.toI32());
  listing.endTimestamp = BigInt.fromI32(payload.endTimestamp.toI32());
  listing.reserved = payload.reserved;
  listing.status = mapStatus(payload.status);
  listing.save();

  recordEvent(event, "UPDATED_LISTING", listing, null, null, payload.listingCreator);
}

export function handleCancelledListing(event: CancelledListingEvent): void {
  const listing = Listing.load(event.params.listingId.toString());
  if (listing !== null) {
    listing.status = "CANCELLED";
    listing.updatedAt = event.block.timestamp;
    listing.save();
    recordEvent(
      event,
      "CANCELLED_LISTING",
      listing,
      null,
      null,
      event.params.listingCreator,
    );
  }
}

export function handleNewSale(event: NewSaleEvent): void {
  const listing = getOrCreateListing(event.params.listingId, event);
  listing.status = "COMPLETED";
  listing.save();

  const sale = new Sale(eventId(event));
  sale.listing = listing.id;
  sale.buyer = event.params.buyer;
  sale.quantity = event.params.quantityBought;
  sale.totalPrice = event.params.totalPricePaid;
  sale.txHash = event.transaction.hash;
  sale.blockNumber = event.block.number;
  sale.timestamp = event.block.timestamp;
  sale.save();

  recordEvent(event, "NEW_SALE", listing, null, null, event.params.buyer);
}

export function handleNewAuction(event: NewAuctionEvent): void {
  const payload = event.params.auction;
  const auction = getOrCreateAuction(payload.auctionId, event);
  auction.creator = payload.auctionCreator;
  auction.assetContract = payload.assetContract;
  auction.tokenId = payload.tokenId;
  auction.quantity = payload.quantity;
  auction.minimumBidAmount = payload.minimumBidAmount;
  auction.buyoutBidAmount = payload.buyoutBidAmount;
  auction.currency = payload.currency;
  auction.startTimestamp = BigInt.fromI32(payload.startTimestamp.toI32());
  auction.endTimestamp = BigInt.fromI32(payload.endTimestamp.toI32());
  auction.bidBufferBps = BigInt.fromI32(payload.bidBufferBps.toI32());
  auction.timeBufferInSeconds = BigInt.fromI32(
    payload.timeBufferInSeconds.toI32(),
  );
  auction.status = mapStatus(payload.status);
  auction.save();

  recordEvent(event, "NEW_AUCTION", null, auction, null, payload.auctionCreator);
}

export function handleNewBid(event: NewBidEvent): void {
  const auction = getOrCreateAuction(event.params.auctionId, event);
  const payload = event.params.auction;
  auction.minimumBidAmount = payload.minimumBidAmount;
  auction.buyoutBidAmount = payload.buyoutBidAmount;
  auction.endTimestamp = BigInt.fromI32(payload.endTimestamp.toI32());
  auction.status = mapStatus(payload.status);
  auction.save();

  const bid = new Bid(eventId(event));
  bid.auction = auction.id;
  bid.bidder = event.params.bidder;
  bid.amount = event.params.bidAmount;
  bid.txHash = event.transaction.hash;
  bid.blockNumber = event.block.number;
  bid.timestamp = event.block.timestamp;
  bid.save();

  recordEvent(event, "NEW_BID", null, auction, null, event.params.bidder);
}

export function handleAuctionClosed(event: AuctionClosedEvent): void {
  const auction = Auction.load(event.params.auctionId.toString());
  if (auction !== null) {
    auction.status = event.params.winningBidder.equals(Address.zero())
      ? "CANCELLED"
      : "COMPLETED";
    auction.updatedAt = event.block.timestamp;
    auction.save();
    recordEvent(
      event,
      "AUCTION_CLOSED",
      null,
      auction,
      null,
      event.params.closer,
      event.params.winningBidder.toHexString(),
    );
  }
}

export function handleNewOffer(event: NewOfferEvent): void {
  const payload = event.params.offer;
  const offer = getOrCreateOffer(payload.offerId, event);
  offer.offeror = payload.offeror;
  offer.assetContract = payload.assetContract;
  offer.tokenId = payload.tokenId;
  offer.quantity = payload.quantity;
  offer.totalPrice = payload.totalPrice;
  offer.currency = payload.currency;
  offer.expirationTimestamp = payload.expirationTimestamp;
  offer.status = mapStatus(payload.status);
  offer.save();

  recordEvent(event, "NEW_OFFER", null, null, offer, payload.offeror);
}

export function handleAcceptedOffer(event: AcceptedOfferEvent): void {
  const offer = Offer.load(event.params.offerId.toString());
  if (offer !== null) {
    offer.status = "COMPLETED";
    offer.acceptedTx = event.transaction.hash;
    offer.updatedAt = event.block.timestamp;
    offer.save();
    recordEvent(
      event,
      "ACCEPTED_OFFER",
      null,
      null,
      offer,
      event.params.seller,
    );
  }
}

export function handleCancelledOffer(event: CancelledOfferEvent): void {
  const offer = Offer.load(event.params.offerId.toString());
  if (offer !== null) {
    offer.status = "CANCELLED";
    offer.updatedAt = event.block.timestamp;
    offer.save();
    recordEvent(
      event,
      "CANCELLED_OFFER",
      null,
      null,
      offer,
      event.params.offeror,
    );
  }
}
