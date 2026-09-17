import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BrandLockup } from "../src/components/layout/brand-lockup.tsx";

test("brand lockup renders DOE and PULSE identities", () => {
  const markup = renderToStaticMarkup(
    React.createElement(BrandLockup, { variant: "full" })
  );

  assert.match(markup, /DOE%20LOGO%20OFFICIAL%20PNG\.png/);
  assert.match(markup, /pulselogo\.svg/);
  assert.match(markup, /pulselogo-dark-text\.svg/);
  assert.match(markup, /hidden[^\"]*dark:block/);
  assert.match(markup, /Bagong%20Pilipinas\.png/);
  assert.match(markup, /h-20 w-28/);
  assert.match(markup, /sm:h-24 sm:w-32/);
  assert.match(markup, /bg-transparent/);
  assert.doesNotMatch(markup, /bg-white/);
  assert.match(markup, /Department of Energy Philippines/);
  assert.match(markup, /Personnel &amp; Unit Lifecycle System for Equipment/);

  const doeIndex = markup.indexOf("DOE%20LOGO%20OFFICIAL%20PNG.png");
  const pulseIndex = markup.indexOf("pulselogo.svg");
  const bagongIndex = markup.indexOf("Bagong%20Pilipinas.png");
  assert.ok(doeIndex >= 0 && doeIndex < pulseIndex && pulseIndex < bagongIndex);
});
