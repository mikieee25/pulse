import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const config = await readFile(
  new URL("../next.config.ts", import.meta.url),
  "utf8"
);
test("public brand assets use safe browser caching", () => {
  assert.match(config, /Cache-Control/);
  for (const asset of [
    "pulseicon",
    "pulselogo",
    "pulselogo-dark-text",
    "DOE%20LOGO%20OFFICIAL%20PNG",
    "Bagong%20Pilipinas",
  ])
    assert.match(config, new RegExp(asset));
  assert.match(config, /max-age=86400/);
  assert.match(config, /stale-while-revalidate=604800/);
  assert.match(config, /source: "\/\(\.\*\)"/);
});
