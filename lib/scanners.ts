export function explorerLink(chain: "bsc" | "core", address: string) {
  if (chain === "bsc") return `https://bscscan.com/address/${address}`;
  return `https://scan.coredao.org/address/${address}`;
}
