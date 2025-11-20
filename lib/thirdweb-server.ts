import "server-only";

import { createThirdwebClient } from "thirdweb";

import { client as publicClient } from "./thirdweb";

const secretKey = process.env.THIRDWEB_SECRET_KEY;

if (!secretKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "⚠️ THIRDWEB_SECRET_KEY is not set. Falling back to the public client ID which may fail for server-side requests.",
  );
}

export const serverClient = secretKey
  ? createThirdwebClient({ secretKey })
  : publicClient;
