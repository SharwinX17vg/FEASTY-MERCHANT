import assert from "node:assert/strict";
import test from "node:test";

import { validateBranch } from "../lib/validation/branch.ts";

test("normalizes a valid branch", () => {
  const result = validateBranch({
    name: "  Downtown  ",
    address_line_1: "12 Market Road",
    city: "Pune",
    country_code: "in",
  });

  assert.deepEqual(result.errors, {});
  assert.equal(result.values.name, "Downtown");
  assert.equal(result.values.country_code, "IN");
  assert.equal(result.values.address_line_2, null);
});

test("rejects invalid branch fields", () => {
  const result = validateBranch({
    name: "x",
    address_line_1: "",
    city: "",
    country_code: "IND",
  });

  assert.equal(result.errors.name, "Location name must be between 2 and 160 characters.");
  assert.equal(result.errors.address_line_1, "Enter an address of 240 characters or fewer.");
  assert.equal(result.errors.city, "City must be between 2 and 120 characters.");
  assert.equal(result.errors.country_code, "Use a two-letter country code, such as IN.");
});
