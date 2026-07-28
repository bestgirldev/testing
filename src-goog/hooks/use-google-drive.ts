"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchDriveFiles,
  type DriveFilesParams,
  uploadDriveFile,
} from "@/lib/api/google-workspace";

export const googleDriveKeys = {
  all: ["google-drive"] as const,
  files: (params: DriveFilesParams) =>
    [...googleDriveKeys.all, "files", params] as const,
};

export function useGoogleDriveFiles(params: DriveFilesParams = {}) {
  return useQuery({
    queryKey: googleDriveKeys.files(params),
    queryFn: () => fetchDriveFiles(params),
  });
}

export function useUploadGoogleDriveFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadDriveFile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: googleDriveKeys.all });
    },
  });
}
