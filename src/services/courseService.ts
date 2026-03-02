/**
 * Course service: CRUD for courses (same format as student Course view).
 * Fetches list from API when authenticated; falls back to localStorage for demo/admin.
 */

import api from './api';
import type { Course, CourseWeek, CourseSection } from '../types/course';
import { blockchainBasicsWeek1 } from '../data/blockchainWeek1';

const STORAGE_KEY = 'lms_courses';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/** Migrate legacy course: ensure weeks shape and default courseCode. */
function normalizeCourse(c: Course): Course {
  let out: Course = { ...c };
  if (!out.courseCode) {
    out.courseCode = out.id.replace(/\s+/g, '-').toUpperCase().slice(0, 32) || 'COURSE';
  }
  if (out.weeks && out.weeks.length > 0) return out;
  const sections = out.sections ?? [];
  out.weeks = [{ id: 'week-1', title: 'Week 1', order: 1, sections }];
  out.sections = undefined;
  return out;
}

function loadCourses(): Course[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = [blockchainBasicsWeek1];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as Course[];
    return parsed.map(normalizeCourse);
  } catch {
    return [blockchainBasicsWeek1];
  }
}

function saveCourses(courses: Course[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
}

/** Normalize backend course (sections only) to frontend Course shape. */
function fromApiCourse(c: { id: string; title: string; description?: string; courseCode?: string; sections?: unknown }): Course {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    courseCode: c.courseCode,
    sections: Array.isArray(c.sections) ? c.sections as Course['sections'] : [],
  };
}

export const courseService = {
  /** Fetch courses from API (returns only courses the user can access for students). Syncs result to localStorage so getAll() and getAccessibleCourseIds() stay in sync. */
  async fetchCourses(): Promise<Course[]> {
    const response = await api.get<{ success?: boolean; data?: { courses?: unknown[] }; courses?: unknown[] }>('/courses');
    const data = response.data;
    const raw = data?.courses ?? data?.data?.courses;
    if (!Array.isArray(raw)) return [];
    const list = raw.map((c) => fromApiCourse(c as Parameters<typeof fromApiCourse>[0]));
    saveCourses(list);
    return list;
  },

  /** GET /courses/:id - single course (for edit or access check). */
  async fetchCourseById(id: string): Promise<Course | null> {
    try {
      const response = await api.get<{ success?: boolean; data?: unknown }>(`/courses/${id}`);
      const data = response.data?.data;
      if (data && typeof data === 'object' && 'id' in data) {
        return fromApiCourse(data as Parameters<typeof fromApiCourse>[0]);
      }
      return null;
    } catch {
      return null;
    }
  },

  /** GET /courses/:id/members - list members (users with this course's code). */
  async fetchCourseMembers(courseId: string): Promise<{ id: string; name: string; email: string; role: string }[]> {
    const response = await api.get<{ success?: boolean; data?: { members?: { id: string; name: string; email: string; role: string }[] } }>(`/courses/${courseId}/members`);
    const members = response.data?.data?.members;
    return Array.isArray(members) ? members : [];
  },

  /** POST /courses/:id/members - add user to course (adds course code to user). */
  async addCourseMember(courseId: string, userId: string): Promise<void> {
    await api.post(`/courses/${courseId}/members`, { userId });
  },

  /** DELETE /courses/:id/members/:userId - remove user from course. */
  async removeCourseMember(courseId: string, userId: string): Promise<void> {
    await api.delete(`/courses/${courseId}/members/${userId}`);
  },

  /** Flatten weeks to sections for backend (backend uses flat sections array). */
  toBackendSections(course: Course): CourseSection[] {
    const weeks = course.weeks ?? (course.sections ? [{ id: 'week-1', title: 'Week 1', order: 1, sections: course.sections }] : []);
    return weeks.flatMap((w) => w.sections ?? []);
  },

  /** POST /courses - create course (admin). Refreshes local course list after success. */
  async createCourse(course: Course): Promise<Course> {
    const sections = this.toBackendSections(course);
    const response = await api.post<{ success?: boolean; data?: unknown }>('/courses', {
      id: course.id,
      title: course.title,
      description: course.description ?? null,
      courseCode: course.courseCode || course.id.replace(/\s+/g, '-').toUpperCase().slice(0, 32),
      sections,
    });
    const data = response.data?.data;
    if (data && typeof data === 'object' && 'id' in data) {
      await this.fetchCourses();
      return fromApiCourse(data as Parameters<typeof fromApiCourse>[0]);
    }
    throw new Error('Failed to create course');
  },

  /** PUT /courses/:id - update course (admin). Refreshes local course list after success. */
  async updateCourse(id: string, course: Course): Promise<Course> {
    const sections = this.toBackendSections(course);
    const response = await api.put<{ success?: boolean; data?: unknown }>(`/courses/${id}`, {
      title: course.title,
      description: course.description ?? null,
      courseCode: course.courseCode,
      sections,
    });
    const data = response.data?.data;
    if (data && typeof data === 'object' && 'id' in data) {
      await this.fetchCourses();
      return fromApiCourse(data as Parameters<typeof fromApiCourse>[0]);
    }
    throw new Error('Failed to update course');
  },

  /** DELETE /courses/:id - delete course (admin). Refreshes local course list after success. */
  async deleteCourse(id: string): Promise<void> {
    await api.delete(`/courses/${id}`);
    await this.fetchCourses();
  },

  getAll(): Course[] {
    return loadCourses();
  },

  getById(id: string): Course | null {
    const courses = loadCourses();
    return courses.find((c) => c.id === id) ?? null;
  },

  save(course: Course): Course {
    const courses = loadCourses();
    const index = courses.findIndex((c) => c.id === course.id);
    const toSave = { ...course };
    if (index >= 0) {
      courses[index] = toSave;
    } else {
      if (!toSave.id) toSave.id = generateId();
      courses.unshift(toSave);
    }
    saveCourses(courses);
    return toSave;
  },

  delete(id: string): void {
    const courses = loadCourses().filter((c) => c.id !== id);
    saveCourses(courses);
  },

  generateId,
};
