import assert from "node:assert/strict";
import test from "node:test";
import {
  equipmentFiltersQuery,
  parseEquipmentFilters,
} from "../src/lib/equipment-filters.ts";

test("equipment filters parse defaults and serialize a shareable query", () => {
  assert.deepEqual(parseEquipmentFilters(new URLSearchParams()), {
    q: "",
    division: "",
    brand: "",
    status: "",
    assignment: "",
    rts: "",
    page: 1,
    pageSize: 25,
  });

  const filters = parseEquipmentFilters(
    new URLSearchParams("q=dell&status=Broken&page=2&assignment=unassigned&rts=rts")
  );
  assert.equal(
    equipmentFiltersQuery(filters, "Laptop"),
    "category=Laptop&q=dell&status=Broken&assignment=unassigned&rts=rts&page=2"
  );
  assert.equal(
    parseEquipmentFilters(new URLSearchParams("page=-1&status=Unknown")).page,
    1
  );
  assert.equal(
    parseEquipmentFilters(new URLSearchParams("page=-1&status=Unknown")).status,
    ""
  );
});
