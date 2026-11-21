export class InvalidJsonBodyError extends Error {
  constructor(message = "Request body must be a JSON object.") {
    super(message);
    this.name = "InvalidJsonBodyError";
  }
}

export function getInvalidJsonBodyResponse(error: unknown): Response | undefined {
  if (!(error instanceof InvalidJsonBodyError)) return undefined;
  return Response.json({ message: error.message }, { status: 400 });
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new InvalidJsonBodyError("Request body must contain valid JSON.");
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new InvalidJsonBodyError();
  }

  return body as Record<string, unknown>;
}
