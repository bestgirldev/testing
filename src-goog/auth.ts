import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

type GoogleRefreshResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: GOOGLE_SCOPES,
          access_type: "offline",
          prompt: "consent",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // First Google sign-in.
      if (account?.provider === "google") {
        if (!account.access_token) {
          return { ...token, error: "RefreshTokenError" as const };
        }

        return {
          ...token,
          access_token: account.access_token,
          expires_at:
            account.expires_at ??
            Math.floor(Date.now() / 1000) + (account.expires_in ?? 3600),
          // Google may omit this after the first consent, so retain it later.
          refresh_token: account.refresh_token ?? token.refresh_token,
          error: undefined,
        };
      }

      // Access token still valid. Refresh one minute early.
      if (
        token.access_token &&
        token.expires_at &&
        Date.now() < (token.expires_at - 60) * 1000
      ) {
        return token;
      }

      if (!token.refresh_token) {
        return { ...token, error: "RefreshTokenError" as const };
      }

      try {
        const response = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type: "refresh_token",
            refresh_token: token.refresh_token,
          }),
        });

        const refreshed = (await response.json()) as
          | GoogleRefreshResponse
          | { error?: string; error_description?: string };

        if (!response.ok || !("access_token" in refreshed)) {
          throw new Error(
            "error_description" in refreshed
              ? refreshed.error_description
              : "Google token refresh failed",
          );
        }

        return {
          ...token,
          access_token: refreshed.access_token,
          expires_at: Math.floor(Date.now() / 1000 + refreshed.expires_in),
          refresh_token: refreshed.refresh_token ?? token.refresh_token,
          error: undefined,
        };
      } catch (error) {
        console.error("Unable to refresh Google access token", error);
        return { ...token, error: "RefreshTokenError" as const };
      }
    },
    async session({ session, token }) {
      // Used only by server API routes in this example.
      session.accessToken = token.access_token;
      session.error = token.error;
      return session;
    },
  },
});
