import assert from "node:assert/strict";
import test from "node:test";

import {
  getInvalidJsonBodyResponse,
  InvalidJsonBodyError,
  readJsonObject,
} from "../lib/http/request.ts";
import { mutationErrorResponse } from "../lib/supabase/errors.ts";

test("rejects malformed and non-object JSON request bodies", async () => {
  for (const [body, message] of [
    ["", "Request body must contain valid JSON."],
    ["{", "Request body must contain valid JSON."],
    ["null", "Request body must be a JSON object."],
    ["[]", "Request body must be a JSON object."],
    ["true", "Request body must be a JSON object."],
    ["42", "Request body must be a JSON object."],
    ['"text"', "Request body must be a JSON object."],
  ]) {
    let error: unknown;
    try {
      await readJsonObject(new Request("http://localhost", { body, method: "POST" }));
    } catch (caught) {
      error = caught;
    }
    assert.ok(error instanceof InvalidJsonBodyError);
    assert.equal(error.message, message);
    const response = getInvalidJsonBodyResponse(error);
    assert.ok(response);
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { message });
  }
  assert.equal(getInvalidJsonBodyResponse(new Error("unexpected")), undefined);
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
