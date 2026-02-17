import { FusionSDK, NetworkEnum, type HttpProviderConnector } from "@1inch/fusion-sdk";

const FUSION_URL = "https://api.1inch.dev/fusion";

function getHttpProvider(authKey: string): HttpProviderConnector {
  return {
    async get<T>(url: string): Promise<T> {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${authKey}` },
        cache: "no-store",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Fusion GET ${res.status}`);
      }
      return (await res.json()) as T;
    },
    async post<T>(url: string, data: unknown): Promise<T> {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        cache: "no-store",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Fusion POST ${res.status}`);
      }
      return (await res.json()) as T;
    },
  };
}

export function getFusionSdk() {
  const authKey = process.env.ONEINCH_API_KEY;
  if (!authKey) {
    throw new Error("ONEINCH_API_KEY is not set");
  }
  return new FusionSDK({
    url: FUSION_URL,
    network: NetworkEnum.BINANCE,
    httpProvider: getHttpProvider(authKey),
  });
}

export function normalizeBigInt(value: any): any {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map((item) => normalizeBigInt(item));
  if (value && typeof value === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = normalizeBigInt(v);
    }
    return out;
  }
  return value;
}
