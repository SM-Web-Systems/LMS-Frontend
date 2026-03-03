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

  async setMembers(_courseId: string, _userIds: string[]): Promise<void> {
    // Managed through addCourseMember / removeCourseMember on the server
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
