import assert from "node:assert/strict";
import test from "node:test";

import {
  createDefaultBusinessHours,
  validateBusinessHours,
} from "../lib/validation/business-hours.ts";

test("normalizes closed days and preserves a valid open schedule", () => {
  const result = validateBusinessHours({
    monday: { is_open: true, open_time: "09:00", close_time: "18:00" },
    tuesday: { is_open: false, open_time: "09:00", close_time: "18:00" },
  });

  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.values.monday, {
    is_open: true,
    open_time: "09:00",
    close_time: "18:00",
  });
  assert.deepEqual(result.values.tuesday, {
    is_open: false,
    open_time: null,
    close_time: null,
  });
  assert.equal(result.values.sunday.is_open, false);
});

test("rejects missing times and invalid time ranges", () => {
  const result = validateBusinessHours({
    monday: { is_open: true, open_time: "", close_time: "18:00" },
    tuesday: { is_open: true, open_time: "19:00", close_time: "18:00" },
    wednesday: { is_open: true, open_time: "9:00", close_time: "10:00" },
  });

  assert.equal(result.errors.monday, "Opening and closing times are required for open days.");
  assert.equal(result.errors.tuesday, "Closing time must be later than opening time.");
  assert.equal(result.errors.wednesday, "Use valid times in 24-hour format.");
});

test("creates a complete closed weekly schedule", () => {
  const schedule = createDefaultBusinessHours();
  assert.equal(Object.keys(schedule).length, 7);
  assert.ok(Object.values(schedule).every((day) => !day.is_open));
});
