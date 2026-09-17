import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { isActiveNow } from "../src/lib/presence.ts";

const actionSource = await readFile(
  new URL("../src/app/actions/presence.ts", import.meta.url),
  "utf8"
).catch(() => "");
const componentSource = await readFile(
  new URL("../src/components/presence/presence-heartbeat.tsx", import.meta.url),
  "utf8"
).catch(() => "");
const loginRouteSource = await readFile(
  new URL("../src/app/auth/login/route.ts", import.meta.url),
  "utf8"
);

test("active now includes the exact five-minute boundary", () => {
  assert.equal(
    isActiveNow(
      "2026-09-16T10:00:00.000Z",
      new Date("2026-09-16T10:05:00.000Z")
    ),
    true
  );
  assert.equal(
    isActiveNow(
      "2026-09-16T09:59:59.999Z",
      new Date("2026-09-16T10:05:00.000Z")
    ),
    false
  );
  assert.equal(isActiveNow(null, new Date("2026-09-16T10:05:00.000Z")), false);
});

test("heartbeat is authenticated, visible-page, and minute-based", () => {
  assert.match(actionSource, /requireProfile\(\)/);
  assert.match(actionSource, /user_presence/);
  assert.match(componentSource, /visibilitychange/);
  assert.match(componentSource, /setInterval/);
  assert.match(componentSource, /60000/);
});

test("successful login records an initial presence timestamp", () => {
  assert.match(loginRouteSource, /touchPresence/);
});
