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
  sample_rate?: number | null;
  created_at: string;
}

export interface WalkieTalkieDriver {
  id: number;
  name: string;
  avatar?: string;
}

export interface AdminDriverVoiceMessage {
  id: number;
  sender: number;
  recipient: number;
  sender_name: string | null;
  recipient_name: string | null;
  file_path: string;
  duration_seconds: number | null;
  sample_rate: number | null;
  read_at: string | null;
  created_at: string;
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

  listDirectMessages: (params?: { driver_id?: number; recipient?: "me" }): Promise<AdminDriverVoiceMessage[]> => {
    const q = new URLSearchParams();
    if (params?.driver_id != null) q.set("driver_id", String(params.driver_id));
    if (params?.recipient === "me") q.set("recipient", "me");
    const query = q.toString();
    const url = query ? `walkietalkie/direct-messages/?${query}` : "walkietalkie/direct-messages/";
    return api.get<AdminDriverVoiceMessage[]>(url);
  },

  getDirectMessagePlayBlob: (id: number): Promise<Blob> =>
    apiClient
      .get(`walkietalkie/direct-messages/${id}/play/`, { responseType: "blob" })
      .then((res) => res.data as Blob),

  markDirectMessageRead: (id: number): Promise<AdminDriverVoiceMessage> =>
    apiClient.patch(`walkietalkie/direct-messages/${id}/`, {}).then((res) => res.data as AdminDriverVoiceMessage),
};
