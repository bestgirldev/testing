import "server-only";

import { google } from "googleapis";
import { auth } from "@/auth";

export class GoogleAuthenticationError extends Error {
  constructor(
    message: string,
    public readonly status = 401,
  ) {
    super(message);
    this.name = "GoogleAuthenticationError";
  }
}

export async function getGoogleAuthClient() {
  const session = await auth();

  if (!session?.user) {
    throw new GoogleAuthenticationError("You must be signed in.");
  }

  if (session.error === "RefreshTokenError") {
    throw new GoogleAuthenticationError(
      "Google authorization expired. Sign out and connect Google again.",
    );
  }

  if (!session.accessToken) {
    throw new GoogleAuthenticationError(
      "No Google access token is available. Connect Google again.",
    );
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: session.accessToken });

  return oauth2Client;
}

export async function getDriveClient() {
  return google.drive({
    version: "v3",
    auth: await getGoogleAuthClient(),
  });
}

export async function getCalendarClient() {
  return google.calendar({
    version: "v3",
    auth: await getGoogleAuthClient(),
  });
}
