/**
 * Course enrollment: which users are in which courses. Used for "people in my course" and messaging.
 * Uses localStorage; replace with backend GET/POST /courses/:id/members when ready.
 */

import { userDirectoryService } from './userDirectoryService';
import { courseService } from './courseService';
import type { DirectoryUser } from '../types/directory';

const STORAGE_KEY = 'lms_course_enrollments';

function load(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function save(enrollments: Record<string, string[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(enrollments));
}

export const enrollmentService = {
  getMembers(courseId: string): string[] {
    return load()[courseId] ?? [];
  },

  getMyCourses(userId: string): string[] {
    const enrollments = load();
    return Object.keys(enrollments).filter((courseId) =>
      enrollments[courseId].includes(userId)
    );
  },

  setMembers(courseId: string, userIds: string[]): void {
    const enrollments = load();
    enrollments[courseId] = [...new Set(userIds)];
    save(enrollments);
  },

  addMember(courseId: string, userId: string, userInfo?: DirectoryUser): void {
    if (userInfo) userDirectoryService.add(userInfo);
    const members = this.getMembers(courseId);
    if (members.includes(userId)) return;
    this.setMembers(courseId, [...members, userId]);
  },

  removeMember(courseId: string, userId: string): void {
    this.setMembers(courseId, this.getMembers(courseId).filter((id) => id !== userId));
  },

  /**
   * Course-code-based access: returns course IDs the user can access (courses whose courseCode
   * is in the user's courseCodes). Use for filtering visible courses and resources.
   */
  getAccessibleCourseIds(userId: string): string[] {
    const dirUser = userDirectoryService.get(userId);
    const codes = dirUser?.courseCodes ?? [];
    if (codes.length === 0) return [];
    return courseService.getAll().filter((c) => c.courseCode && codes.includes(c.courseCode)).map((c) => c.id);
  },

  /** Returns peers in any of the current user's courses (excluding self). For admin with no courses, returns all other users in directory. */
  getPeersInMyCourses(userId: string, isAdmin?: boolean): { id: string; name: string }[] {
    const courseIds = this.getMyCourses(userId);
    const peerIds = new Set<string>();
    if (courseIds.length > 0) {
      courseIds.forEach((cid) => {
        this.getMembers(cid).forEach((id) => { if (id !== userId) peerIds.add(id); });
      });
    } else if (isAdmin) {
      userDirectoryService.getAll().forEach((u) => { if (u.id !== userId) peerIds.add(u.id); });
    }
    const dir = userDirectoryService.getAll();
    return [...peerIds].map((id) => {
      const u = dir.find((d) => d.id === id);
      return { id, name: u?.name ?? id };
    }).sort((a, b) => a.name.localeCompare(b.name));
  },
};
