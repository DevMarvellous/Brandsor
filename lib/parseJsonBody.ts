import { errorResponse } from "@/lib/apiErrors";

export type ParseJsonResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: ReturnType<typeof errorResponse> };

/**
 * Reads the request body as text (bounded) then parses JSON.
 */
export async function parseJsonBody<T = unknown>(
  req: Request,
  maxBytes: number
): Promise<ParseJsonResult<T>> {
  const text = await req.text();
  if (text.length > maxBytes) {
    return {
      ok: false,
      response: errorResponse(
        "BAD_REQUEST",
        "Request body too large",
        413
      ),
    };
  }
  if (!text.trim()) {
    return {
      ok: false,
      response: errorResponse("BAD_REQUEST", "Empty body", 400),
    };
  }
  try {
    const data = JSON.parse(text) as T;
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      response: errorResponse("BAD_REQUEST", "Invalid JSON", 400),
    };
  }
}
