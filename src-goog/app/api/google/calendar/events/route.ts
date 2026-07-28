import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import type { calendar_v3 } from "googleapis";
import { getCalendarClient } from "@/lib/google/client";
import { googleRouteError } from "@/lib/google/http-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EventDateTime = {
  date?: string;
  dateTime?: string;
  timeZone?: string;
};

type CreateEventBody = {
  calendarId?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: EventDateTime;
  end?: EventDateTime;
  attendees?: string[];
  sendUpdates?: "all" | "externalOnly" | "none";
  createMeetLink?: boolean;
};

function boundedInteger(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), 1), max);
}

function isValidEventTime(value: EventDateTime | undefined) {
  return Boolean(value?.date || value?.dateTime);
}

export async function GET(request: NextRequest) {
  try {
    const calendar = await getCalendarClient();
    const params = request.nextUrl.searchParams;

    const calendarId = params.get("calendarId") || "primary";
    const pageToken = params.get("pageToken") || undefined;
    const search = params.get("search") || undefined;
    const timeZone = params.get("timeZone") || undefined;
    const timeMin = params.get("timeMin") || new Date().toISOString();
    const timeMax = params.get("timeMax") || undefined;
    const maxResults = boundedInteger(params.get("maxResults"), 50, 2500);

    const response = await calendar.events.list({
      calendarId,
      pageToken,
      q: search,
      timeMin,
      timeMax,
      timeZone,
      maxResults,
      singleEvents: true,
      orderBy: "startTime",
    });

    return NextResponse.json({
      events: response.data.items ?? [],
      nextPageToken: response.data.nextPageToken ?? null,
      nextSyncToken: response.data.nextSyncToken ?? null,
      timeZone: response.data.timeZone ?? null,
    });
  } catch (error) {
    return googleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateEventBody;

    if (!body.summary?.trim()) {
      return NextResponse.json(
        { error: "Event summary is required." },
        { status: 400 },
      );
    }

    if (!isValidEventTime(body.start) || !isValidEventTime(body.end)) {
      return NextResponse.json(
        { error: "Both start and end must contain dateTime or date." },
        { status: 400 },
      );
    }

    const calendar = await getCalendarClient();

    const requestBody: calendar_v3.Schema$Event = {
      summary: body.summary.trim(),
      description: body.description?.trim() || undefined,
      location: body.location?.trim() || undefined,
      start: body.start,
      end: body.end,
      attendees: body.attendees
        ?.filter((email) => typeof email === "string" && email.trim())
        .map((email) => ({ email: email.trim() })),
      conferenceData: body.createMeetLink
        ? {
            createRequest: {
              requestId: randomUUID(),
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          }
        : undefined,
    };

    const response = await calendar.events.insert({
      calendarId: body.calendarId || "primary",
      requestBody,
      sendUpdates: body.sendUpdates ?? "all",
      conferenceDataVersion: body.createMeetLink ? 1 : 0,
    });

    return NextResponse.json({ event: response.data }, { status: 201 });
  } catch (error) {
    return googleRouteError(error);
  }
}
