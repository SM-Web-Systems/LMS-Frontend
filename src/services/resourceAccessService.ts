/**
 * Resource (document) access: which courses can see which document.
 * Empty courseIds = open to all students. Otherwise only students enrolled in at least one of the courseIds can access.
 * Uses localStorage; replace with backend when documents API supports courseIds.
 */

const STORAGE_KEY = 'lms_resource_access';

function load(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function save(access: Record<string, string[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(access));
}

export const resourceAccessService = {
  getCourseIds(documentId: string): string[] {
    const access = load();
    return access[documentId] ?? [];
  },

  setCourseIds(documentId: string, courseIds: string[]): void {
    const access = load();
    access[documentId] = [...courseIds];
    save(access);
  },

  remove(documentId: string): void {
    const access = load();
    delete access[documentId];
    save(access);
  },

  /** True if document is open (no restriction) or user's courses intersect with document's courses. */
  canAccess(documentId: string, userEnrolledCourseIds: string[]): boolean {
    const courseIds = this.getCourseIds(documentId);
    if (courseIds.length === 0) return true;
    return courseIds.some((cid) => userEnrolledCourseIds.includes(cid));
  },
};
