import { api } from "@/lib/api";
import apiClient from "@/lib/api";

export interface WalkieTalkieGroup {
  id: number;
  name: string;
  created_at: string;
  member_count: number;
}

export interface WalkieTalkieRecording {
  id: number;
  group: number;
  user: number;
  user_name?: string;
  user_avatar?: string;
  started_at: string;
  ended_at: string;
  file_path: string | null;
  storage_key: string | null;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  created_at: string;
}

export interface WalkieTalkieDriver {
  id: number;
  name: string;
  avatar?: string;
}

export const walkietalkieApi = {
  listGroups: (): Promise<WalkieTalkieGroup[]> =>
    api.get<WalkieTalkieGroup[]>("walkietalkie/groups/"),

  listDrivers: (): Promise<WalkieTalkieDriver[]> =>
    api.get<WalkieTalkieDriver[]>("walkietalkie/drivers/"),

  listRecordings: (params?: { group_id?: number; user_id?: number }): Promise<WalkieTalkieRecording[]> => {
    const q = new URLSearchParams();
    if (params?.group_id != null) q.set("group_id", String(params.group_id));
    if (params?.user_id != null) q.set("user_id", String(params.user_id));
    const query = q.toString();
    const url = query ? `walkietalkie/recordings/?${query}` : "walkietalkie/recordings/";
    return api.get<WalkieTalkieRecording[]>(url);
  },

  getRecordingPlayBlob: (id: number): Promise<Blob> =>
    apiClient
      .get(`walkietalkie/recordings/${id}/play/`, { responseType: "blob" })
      .then((res) => res.data as Blob),
};
