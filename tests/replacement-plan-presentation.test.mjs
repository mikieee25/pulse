import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("replacement plan keeps every category readable while emphasizing actionable counts", async () => {
  const replacementPlanModule = await import(
    "../src/components/dashboard/replacement-plan-table.tsx"
  ).catch(() => null);
  assert.ok(
    replacementPlanModule?.ReplacementPlanTable,
    "ReplacementPlanTable must exist"
  );

  const html = renderToStaticMarkup(
    createElement(replacementPlanModule.ReplacementPlanTable, {
      categories: ["Camera", "Laptop", "Monitors"],
      pageSize: 25,
      plan: {
        AFETD: {
          totalExpiring: 2,
          totalBroken: 1,
          categories: {
            Camera: { replacement: 4, total: 22 },
            Laptop: { replacement: 0, total: 0 },
            Monitors: { replacement: 0, total: 8 },
          },
        },
      },
    })
  );

  assert.match(html, /How to read/);
  assert.match(html, /Scroll horizontally to view all categories/);
  assert.match(
    html,
    /role="region"[^>]*aria-label="Scrollable replacement plan table"[^>]*tabindex="0"/
  );
  assert.match(html, /Replace \/ total/);
  assert.match(html, /aria-label="4 Camera units need replacement out of 22 total"/);
  assert.match(html, /aria-label="2 units expiring"/);
  assert.match(html, /aria-label="1 unit broken"/);
  assert.match(html, /aria-label="No Laptop inventory"[^>]*>—</);
  assert.match(html, /aria-label="No Monitors units need replacement out of 8 total"/);
  assert.match(html, /Camera/);
  assert.match(html, /Laptop/);
  assert.match(html, /Monitors/);
});
