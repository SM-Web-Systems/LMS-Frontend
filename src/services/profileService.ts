/**
 * Profile: extended user info (description, etc.). Uses localStorage; replace with API when backend is ready.
 */

export interface UserProfile {
  displayName?: string;
  description?: string;
}

const STORAGE_KEY = 'lms_profiles';

function loadAll(): Record<string, UserProfile> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveAll(profiles: Record<string, UserProfile>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export const profileService = {
  get(userId: string): UserProfile {
    return loadAll()[userId] ?? {};
  },

  save(userId: string, profile: UserProfile): void {
    const all = loadAll();
    all[userId] = { ...all[userId], ...profile };
    saveAll(all);
  },
};
