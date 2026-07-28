import axios from "axios";

export const apiClient = axios.create({
  baseURL: "/api",
  headers: { Accept: "application/json" },
});

export type DriveFile = {
  id?: string | null;
  name?: string | null;
  mimeType?: string | null;
  size?: string | null;
  createdTime?: string | null;
  modifiedTime?: string | null;
  webViewLink?: string | null;
  webContentLink?: string | null;
  iconLink?: string | null;
  thumbnailLink?: string | null;
  parents?: string[] | null;
};

export type DriveFilesParams = {
  search?: string;
  folderId?: string;
  mimeType?: string;
  pageSize?: number;
  pageToken?: string;
};

export type CalendarEventDateTime = {
  date?: string;
  dateTime?: string;
  timeZone?: string;
};

export type CalendarEvent = {
  id?: string | null;
  status?: string | null;
  summary?: string | null;
  description?: string | null;
  location?: string | null;
  htmlLink?: string | null;
  hangoutLink?: string | null;
  start?: CalendarEventDateTime | null;
  end?: CalendarEventDateTime | null;
};

export type CalendarEventsParams = {
  calendarId?: string;
  search?: string;
  timeMin?: string;
  timeMax?: string;
  timeZone?: string;
  maxResults?: number;
  pageToken?: string;
};

export type CreateCalendarEventInput = {
  calendarId?: string;
  summary: string;
  description?: string;
  location?: string;
  start: CalendarEventDateTime;
  end: CalendarEventDateTime;
  attendees?: string[];
  sendUpdates?: "all" | "externalOnly" | "none";
  createMeetLink?: boolean;
};

export async function fetchDriveFiles(params: DriveFilesParams = {}) {
  const response = await apiClient.get<{
    files: DriveFile[];
    nextPageToken: string | null;
  }>("/google/drive/files", { params });

  return response.data;
}

export async function uploadDriveFile(input: {
  file: File;
  folderId?: string;
  name?: string;
}) {
  const formData = new FormData();
  formData.append("file", input.file);
  if (input.folderId) formData.append("folderId", input.folderId);
  if (input.name) formData.append("name", input.name);

  const response = await apiClient.post<{ file: DriveFile }>(
    "/google/drive/upload",
    formData,
  );

  return response.data;
}

export async function fetchCalendarEvents(
  params: CalendarEventsParams = {},
) {
  const response = await apiClient.get<{
    events: CalendarEvent[];
    nextPageToken: string | null;
    nextSyncToken: string | null;
    timeZone: string | null;
  }>("/google/calendar/events", { params });

  return response.data;
}

export async function createCalendarEvent(input: CreateCalendarEventInput) {
  const response = await apiClient.post<{ event: CalendarEvent }>(
    "/google/calendar/events",
    input,
  );

  return response.data;
}
