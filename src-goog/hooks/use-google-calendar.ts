"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCalendarEvent,
  fetchCalendarEvents,
  type CalendarEventsParams,
} from "@/lib/api/google-workspace";

export const googleCalendarKeys = {
  all: ["google-calendar"] as const,
  events: (params: CalendarEventsParams) =>
    [...googleCalendarKeys.all, "events", params] as const,
};

export function useGoogleCalendarEvents(params: CalendarEventsParams = {}) {
  return useQuery({
    queryKey: googleCalendarKeys.events(params),
    queryFn: () => fetchCalendarEvents(params),
  });
}

export function useCreateGoogleCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCalendarEvent,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: googleCalendarKeys.all,
      });
    },
  });
}
