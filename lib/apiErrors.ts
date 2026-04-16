import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "BAD_REQUEST"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "UPSTREAM_ERROR";

export function errorResponse(
  code: ApiErrorCode,
  message: string,
  status: number,
  headers?: HeadersInit
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status, headers }
  );
}
