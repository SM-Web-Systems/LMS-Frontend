/**
 * User directory: id -> name, email, role. Used for messaging and discoverable profiles.
 * Populated from: current user on login, students when admin loads them, and when adding course members.
 * Uses localStorage; replace with GET /users or GET /courses/:id/members when backend is ready.
 */

import type { DirectoryUser } from '../types/directory';

const STORAGE_KEY = 'lms_user_directory';

function load(): Record<string, DirectoryUser> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function save(dir: Record<string, DirectoryUser>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dir));
}

export const userDirectoryService = {
  get(userId: string): DirectoryUser | null {
    return load()[userId] ?? null;
  },

  getAll(): DirectoryUser[] {
    return Object.values(load());
  },

  add(user: DirectoryUser): void {
    const dir = load();
    const existing = dir[user.id];
    dir[user.id] = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      courseCodes: user.courseCodes ?? existing?.courseCodes ?? [],
    };
    save(dir);
  },

  update(userId: string, patch: Partial<DirectoryUser>): void {
    const dir = load();
    const existing = dir[userId];
    if (!existing) return;
    dir[userId] = { ...existing, ...patch };
    save(dir);
  },

  addMany(users: DirectoryUser[]): void {
    const dir = load();
    users.forEach((u) => {
      const existing = dir[u.id];
      dir[u.id] = {
        ...u,
        courseCodes: u.courseCodes ?? existing?.courseCodes ?? [],
      };
    });
    save(dir);
  },
};
