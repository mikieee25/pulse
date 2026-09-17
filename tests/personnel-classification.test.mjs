import assert from "node:assert/strict";
import test from "node:test";
import { effectivePlantillaStatus } from "../src/lib/pulse.ts";

test("effective personnel status groups special positions correctly", () => {
  const records = [
    ["PSS", "Regular"],
    ["PES", "Regular"],
    ["Driver II", "Regular"],
    ["DE I", "Regular"],
    ["Data Encoder", "Regular"],
    ["Chief", "Regular"],
    ["PES", "Outsourced"],
    ["Admin Aide", "COS"],
  ];

  assert.deepEqual(
    records.map(([position, status]) =>
      effectivePlantillaStatus(position, status)
    ),
    [
      "Outsourced",
      "COS",
      "Outsourced",
      "Outsourced",
      "Outsourced",
      "Regular",
      "COS",
      "COS",
    ]
  );
});

test("SRS II is never classified as Outsourced", () => {
  assert.equal(effectivePlantillaStatus("SRS II", "Outsourced"), "Regular");
  assert.equal(
    effectivePlantillaStatus("SRS II", "For Transfer"),
    "For Transfer"
  );
});
