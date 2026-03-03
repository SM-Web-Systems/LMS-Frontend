import api from './api';

export interface UserProfile {
  displayName?: string;
  description?: string;
}

export const profileService = {
  async get(userId: string): Promise<UserProfile> {
    try {
      const res = await api.get<{ success: boolean; data: { displayName?: string; description?: string } }>(`/users/${userId}`);
      const d = res.data?.data;
      return { displayName: d?.displayName ?? undefined, description: d?.description ?? undefined };
    } catch {
      return {};
    }
  },

  async save(userId: string, profile: UserProfile): Promise<void> {
    await api.patch(`/users/${userId}`, profile);
  },
};
