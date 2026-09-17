import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../src/components/layout/panel-skeleton.tsx", import.meta.url),
  "utf8"
);

test("panel skeleton renders visible accessible placeholder content", () => {
  assert.match(source, /aria-busy="true"/);
  assert.match(source, /animate-pulse/);
  assert.ok((source.match(/w-(?:full|11\/12|4\/5|10\/12)/g) || []).length >= 4);
  assert.ok((source.match(/rounded/g) || []).length >= 4);
});
