import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(
  new URL("../src/app/globals.css", import.meta.url),
  "utf8"
);
const theme = await readFile(
  new URL("../src/styles/theme.css", import.meta.url),
  "utf8"
).catch(() => "");
const layout = await readFile(
  new URL("../src/app/layout.tsx", import.meta.url),
  "utf8"
);
const topbar = await readFile(
  new URL("../src/components/layout/topbar.tsx", import.meta.url),
  "utf8"
);
const toggle = await readFile(
  new URL("../src/components/theme/theme-toggle.tsx", import.meta.url),
  "utf8"
);
const login = await readFile(
  new URL("../src/app/login/page.tsx", import.meta.url),
  "utf8"
);

test("dashboard exposes a persistent light theme", () => {
  assert.match(theme, /--doe-blue:\s*#0000FE/i);
  assert.match(theme, /--doe-yellow:\s*#FFFF00/i);
  assert.match(theme, /--doe-blue-light:\s*#397DFF/i);
  assert.match(theme, /--doe-yellow-light:\s*#FFFE77/i);
  assert.match(theme, /--doe-blue-balanced:\s*#1F5BF6/i);
  assert.match(theme, /--doe-yellow-balanced:\s*#FFEE4D/i);
  assert.match(theme, /--doe-blue-bold:\s*#0341CB/i);
  assert.match(theme, /--doe-yellow-bold:\s*#FADB09/i);
  assert.match(theme, /--doe-blue-deep:\s*#0016A8/i);
  assert.match(theme, /--doe-yellow-deep:\s*#E8B911/i);
  assert.match(css, /@import ["']\.\.\/styles\/theme\.css["']/);
  assert.match(theme, /html\.light/);
  assert.match(theme, /--canvas:/);
  assert.match(css, /--color-canvas:\s*var\(--canvas\)/);
  assert.match(css, /--color-paper:\s*var\(--paper\)/);
  assert.match(css, /--color-pulse:\s*var\(--pulse\)/);
  assert.doesNotMatch(layout, /className={[^}]*\bdark\b/);
  assert.match(theme, /:root\s*\{[\s\S]*--canvas:\s*var\(--surface-light\)/);
  assert.match(theme, /\.dark\s*\{[\s\S]*--canvas:\s*var\(--surface-dark\)/);
  assert.doesNotMatch(
    theme,
    /linear-gradient\([^)]*doe-blue[^)]*doe-yellow|linear-gradient\([^)]*doe-yellow[^)]*doe-blue/i
  );
  assert.match(layout, /suppressHydrationWarning/);
  assert.match(layout, /antialiased light/);
  assert.match(layout, /pulse-theme/);
  assert.match(layout, /localStorage\.getItem/);
  assert.match(topbar, /ThemeToggle/);
  assert.match(toggle, /localStorage/);
  assert.match(toggle, /aria-label=/);
  assert.match(login, /bg-white/);
  assert.match(login, /dark:bg-canvas-deep/);
});
