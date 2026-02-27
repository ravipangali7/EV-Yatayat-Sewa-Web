import { api } from "@/lib/api";

export interface WalkieTalkieGroup {
  id: number;
  name: string;
  created_at: string;
  member_count: number;
}

export const walkietalkieApi = {
  listGroups: (): Promise<WalkieTalkieGroup[]> =>
    api.get<WalkieTalkieGroup[]>("walkietalkie/groups/"),
};
