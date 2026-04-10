import api from './api';
import { courseService } from './courseService';

export const enrollmentService = {
  async getMembers(courseId: string): Promise<string[]> {
    try {
      const members = await courseService.fetchCourseMembers(courseId);
      return members.map((m) => m.id);
    } catch {
      return [];
    }
  },

  async getMyCourses(_userId: string): Promise<string[]> {
    try {
      const courses = await courseService.fetchCourses();
      return courses.map((c) => c.id);
    } catch {
      return [];
    }
  },

  async setMembers(courseId: string, userIds: string[]): Promise<void> {
    const current = await courseService.fetchCourseMembers(courseId);
    const currentIds = new Set(current.map((m) => m.id));
    const target = new Set(userIds);
    for (const id of currentIds) {
      if (!target.has(id)) {
        await courseService.removeCourseMember(courseId, id);
      }
    }
    for (const id of target) {
      if (!currentIds.has(id)) {
        await courseService.addCourseMember(courseId, id);
      }
    }
  },

  async addMember(courseId: string, userId: string): Promise<void> {
    await courseService.addCourseMember(courseId, userId);
  },

  async removeMember(courseId: string, userId: string): Promise<void> {
    await courseService.removeCourseMember(courseId, userId);
  },

  async getAccessibleCourseIds(_userId: string): Promise<string[]> {
    try {
      const courses = await courseService.fetchCourses();
      return courses.map((c) => c.id);
    } catch {
      return [];
    }
  },

  async getPeersInMyCourses(userId: string, _isAdmin?: boolean): Promise<{ id: string; name: string }[]> {
    try {
      const res = await api.get<{ success: boolean; data: { users: { id: string; name: string }[] } }>('/users');
      const users = res.data?.data?.users ?? [];
      return users.filter((u) => u.id !== userId).map((u) => ({ id: u.id, name: u.name }));
    } catch {
      return [];
    }
  },
};
