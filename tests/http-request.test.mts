import assert from "node:assert/strict";
import test from "node:test";

import { InvalidJsonBodyError, readJsonObject } from "../lib/http/request.ts";
import { mutationErrorResponse } from "../lib/supabase/errors.ts";

test("rejects malformed and non-object JSON request bodies", async () => {
  await assert.rejects(
    readJsonObject(new Request("http://localhost", { body: "{", method: "POST" })),
    (error: unknown) => error instanceof InvalidJsonBodyError && error.message.includes("valid JSON"),
  );
  await assert.rejects(
    readJsonObject(new Request("http://localhost", { body: "null", method: "POST" })),
    InvalidJsonBodyError,
  );
  await assert.rejects(
    readJsonObject(new Request("http://localhost", { body: "[]", method: "POST" })),
    InvalidJsonBodyError,
  );
});

test("classifies database mutation failures without exposing database details", () => {
  assert.deepEqual(mutationErrorResponse({ code: "23505" }, "fallback"), {
    message: "This record conflicts with an existing record.",
    status: 409,
  });
  assert.deepEqual(mutationErrorResponse({ code: "42501" }, "fallback"), {
    message: "You do not have permission to perform this action.",
    status: 403,
  });
  assert.deepEqual(mutationErrorResponse({ code: "unexpected" }, "fallback"), {
    message: "fallback",
    status: 503,
  });
});
