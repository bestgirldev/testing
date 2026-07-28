import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { getDriveClient } from "@/lib/google/client";
import { googleRouteError } from "@/lib/google/http-error";

export const runtime = "nodejs";

const DEFAULT_MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folderId = formData.get("folderId");
    const customName = formData.get("name");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'A multipart field named "file" is required.' },
        { status: 400 },
      );
    }

    const maxUploadBytes = Number(
      process.env.GOOGLE_DRIVE_MAX_UPLOAD_BYTES ?? DEFAULT_MAX_UPLOAD_BYTES,
    );

    if (file.size > maxUploadBytes) {
      return NextResponse.json(
        {
          error: `File is too large for this endpoint. Maximum size is ${maxUploadBytes} bytes.`,
        },
        { status: 413 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const drive = await getDriveClient();

    const response = await drive.files.create({
      requestBody: {
        name:
          typeof customName === "string" && customName.trim()
            ? customName.trim()
            : file.name,
        parents:
          typeof folderId === "string" && folderId.trim()
            ? [folderId.trim()]
            : undefined,
      },
      media: {
        mimeType: file.type || "application/octet-stream",
        body: Readable.from(buffer),
      },
      fields:
        "id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,parents",
    });

    return NextResponse.json({ file: response.data }, { status: 201 });
  } catch (error) {
    return googleRouteError(error);
  }
}
