import { NextRequest, NextResponse } from "next/server";
import { getDriveClient } from "@/lib/google/client";
import { googleRouteError } from "@/lib/google/http-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeDriveQueryValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function boundedInteger(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), 1), max);
}

export async function GET(request: NextRequest) {
  try {
    const drive = await getDriveClient();
    const params = request.nextUrl.searchParams;

    const search = params.get("search")?.trim();
    const folderId = params.get("folderId")?.trim();
    const mimeType = params.get("mimeType")?.trim();
    const pageToken = params.get("pageToken") || undefined;
    const pageSize = boundedInteger(params.get("pageSize"), 50, 1000);

    const queryParts = ["trashed = false"];

    if (search) {
      const escaped = escapeDriveQueryValue(search);
      queryParts.push(
        `(name contains '${escaped}' or fullText contains '${escaped}')`,
      );
    }

    if (folderId) {
      queryParts.push(`'${escapeDriveQueryValue(folderId)}' in parents`);
    }

    if (mimeType) {
      queryParts.push(`mimeType = '${escapeDriveQueryValue(mimeType)}'`);
    }

    const response = await drive.files.list({
      q: queryParts.join(" and "),
      spaces: "drive",
      pageSize,
      pageToken,
      orderBy: "modifiedTime desc",
      fields:
        "nextPageToken,files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,iconLink,thumbnailLink,parents,owners(displayName,emailAddress))",
    });

    return NextResponse.json({
      files: response.data.files ?? [],
      nextPageToken: response.data.nextPageToken ?? null,
    });
  } catch (error) {
    return googleRouteError(error);
  }
}
