import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const files = [
  "nft-examples/crypto-mon/metadata.json",
  "nft-examples/meta-houses/metadata.json",
  "nft-examples/toy-soldiers/metadata.json",
];

for (const rel of files) {
  const path = join(root, rel);
  const raw = readFileSync(path, "utf8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to parse ${rel}:`, e.message);
    continue;
  }

  let changed = false;

  const fixColor = (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
    if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
      changed = true;
      return `#${trimmed}`;
    }
    return value;
  };

  if (Array.isArray(data)) {
    for (const item of data) {
      if (item && typeof item === "object" && "background_color" in item) {
        item.background_color = fixColor(item.background_color);
      }
    }
  } else if (data && typeof data === "object") {
    if ("background_color" in data) {
      data.background_color = fixColor(data.background_color);
    }
  }

  if (changed) {
    writeFileSync(path, JSON.stringify(data, null, 2));
    console.log(`Updated background_color values in ${rel}`);
  } else {
    console.log(`No changes needed for ${rel}`);
  }
}
