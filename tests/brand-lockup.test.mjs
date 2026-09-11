import assert from "node:assert/strict"
import test from "node:test"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { BrandLockup } from "../src/components/layout/brand-lockup.tsx"

test("brand lockup renders DOE and PULSE identities", () => {
  const markup = renderToStaticMarkup(React.createElement(BrandLockup, { variant: "full" }))

  assert.match(markup, /DOE%20LOGO%20OFFICIAL%20PNG\.png/)
  assert.match(markup, /pulselogo\.svg/)
  assert.match(markup, /Department of Energy Philippines/)
  assert.match(markup, /Personnel &amp; Unit Lifecycle System for Equipment/)
})
