import { NextResponse } from "next/server";
import { GoogleAuthenticationError } from "./client";

type GoogleErrorShape = {
  message?: string;
  response?: {
    status?: number;
    data?: {
      error?: {
        message?: string;
      };
    };
  };
};

export function googleRouteError(error: unknown) {
  console.error(error);

  if (error instanceof GoogleAuthenticationError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  const googleError = error as GoogleErrorShape;
  const rawStatus = googleError.response?.status ?? 500;
  const status = rawStatus >= 400 && rawStatus <= 599 ? rawStatus : 500;
  const message =
    googleError.response?.data?.error?.message ??
    googleError.message ??
    "Google API request failed.";

  return NextResponse.json({ error: message }, { status });
}
