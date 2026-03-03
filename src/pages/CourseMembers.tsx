import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { courseService } from '../services/courseService';
import { userDirectoryService } from '../services/userDirectoryService';
import { usersService, UserDirectoryItem } from '../services/usersService';
import type { Course } from '../types/course';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Users, MessageCircle, User as UserIcon, Plus, Trash2, KeyRound } from 'lucide-react';

type Member = { id: string; name: string; email: string };

const CourseMembers: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const isAdmin = user?.role === 'admin';
  const userCourseCodes = user?.courseCodes ?? [];

  const [courses, setCourses] = useState<Course[]>([]);
  const [membersByCourseId, setMembersByCourseId] = useState<Record<string, Member[]>>({});
  const [allUsers, setAllUsers] = useState<UserDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [managingCourseId, setManagingCourseId] = useState<string | null>(null);
  const [editingCodesForId, setEditingCodesForId] = useState<string | null>(null);
  const [editingCodesName, setEditingCodesName] = useState('');
  const [draftCourseCodes, setDraftCourseCodes] = useState<string[]>([]);
  const [savingCodes, setSavingCodes] = useState(false);

  const loadCourses = useCallback(async () => {
    try {
      const list = await courseService.fetchCourses();
      setCourses(list);
      return list;
    } catch {
      setCourses([]);
      return [];
    }
  }, []);

  const loadMembersForCourse = useCallback(async (courseId: string) => {
    try {
      const members = await courseService.fetchCourseMembers(courseId);
      setMembersByCourseId((prev) => ({ ...prev, [courseId]: members }));
    } catch {
      setMembersByCourseId((prev) => ({ ...prev, [courseId]: [] }));
    }
  }, []);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const users = await usersService.getUsers();
      setAllUsers(users);
      users.forEach((u) => userDirectoryService.add({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        courseCodes: u.courseCodes,
      }));
    } catch {
      setAllUsers([]);
    }
  }, [isAdmin]);

  useEffect(() => {
    setLoading(true);
    loadCourses().then((list) => {
      const toShow = isAdmin ? list : list.filter((c) => c.courseCode && userCourseCodes.includes(c.courseCode));
      toShow.forEach((c) => loadMembersForCourse(c.id));
      setLoading(false);
    });
  }, [isAdmin, userCourseCodes, loadCourses, loadMembersForCourse]);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin, loadUsers]);

  const allCourseCodes = useMemo(() => [...new Set(courses.map((c) => c.courseCode).filter(Boolean) as string[])].sort(), [courses]);

  const coursesToShow = isAdmin ? courses : courses.filter((c) => c.courseCode && userCourseCodes.includes(c.courseCode));

  const getMembersForCourse = (courseId: string): Member[] => {
    return (membersByCourseId[courseId] ?? []).sort((a, b) => a.name.localeCompare(b.name));
  };

  const openEditCodes = async (memberId: string, memberName: string) => {
    const dirUser = await userDirectoryService.get(memberId);
    setEditingCodesForId(memberId);
    setEditingCodesName(memberName);
    setDraftCourseCodes(dirUser?.courseCodes ?? []);
  };

  const saveCourseCodes = async () => {
    if (!editingCodesForId) return;
    setSavingCodes(true);
    try {
      await usersService.patchUserCourseCodes(editingCodesForId, draftCourseCodes);
      userDirectoryService.update(editingCodesForId, { courseCodes: draftCourseCodes });
      setEditingCodesForId(null);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSavingCodes(false);
    }
  };

  const toggleDraftCode = (code: string) => {
    setDraftCourseCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const addMemberToCourse = async (courseId: string, userItem: UserDirectoryItem) => {
    try {
      await courseService.addCourseMember(courseId, userItem.id);
      await loadMembersForCourse(courseId);
      await loadUsers();
      setManagingCourseId(null);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Failed to add member');
    }
  };

  const removeMemberFromCourse = async (courseId: string, memberId: string) => {
    try {
      await courseService.removeCourseMember(courseId, memberId);
      await loadMembersForCourse(courseId);
      await loadUsers();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Failed to remove member');
    }
  };

  const basePath = user?.role === 'admin' ? '/admin' : '/student';

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <Users className="h-8 w-8 text-primary-600" />
        <div>
          <h1 className="text-3xl font-bold text-neutral-800">Course members</h1>
          <p className="text-neutral-600 mt-0.5">
            {isAdmin ? 'See who is in each course and manage members.' : 'See who is in your courses and message them.'}
          </p>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center text-neutral-600">Loading…</CardContent>
        </Card>
      ) : coursesToShow.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-neutral-600">
            {isAdmin ? 'No courses yet. Create one from the Course tab.' : "You don't have access to any courses yet. Your admin can assign you course codes or add you to a course."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {coursesToShow.map((course) => {
            const members = getMembersForCourse(course.id);
            const isManaging = managingCourseId === course.id;
            const memberIds = new Set(members.map((m) => m.id));
            const availableUsers = allUsers.filter((u) => !memberIds.has(u.id));

            return (
              <Card key={course.id}>
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-neutral-800">{course.title}</h2>
                      {course.courseCode && (
                        <p className="text-sm text-neutral-500 mt-0.5">Code: {course.courseCode}</p>
                      )}
                    </div>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setManagingCourseId(isManaging ? null : course.id)}
                      >
                        {isManaging ? 'Done' : 'Manage members'}
                      </Button>
                    )}
                  </div>
                  {isManaging && availableUsers.length > 0 && (
                    <div className="mb-4 p-3 bg-neutral-50 rounded-lg">
                      <p className="text-sm font-medium text-neutral-700 mb-2">Add to course</p>
                      <div className="flex flex-wrap gap-2">
                        {availableUsers.map((u) => (
                          <Button
                            key={u.id}
                            variant="outline"
                            size="sm"
                            onClick={() => addMemberToCourse(course.id, u)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {u.name} <span className="ml-1 text-xs text-neutral-400">({u.role})</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  {members.length === 0 ? (
                    <p className="text-sm text-neutral-500">No members yet.{isAdmin && ' Use "Manage members" to add people.'}</p>
                  ) : (
                    <ul className="space-y-2">
                      {members.map((m) => (
                        <li
                          key={m.id}
                          className="flex items-center justify-between gap-2 py-2 border-b border-neutral-100 last:border-0"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <UserIcon className="h-4 w-4 text-neutral-400 shrink-0" />
                            <span className="font-medium text-neutral-800 truncate">{m.name}</span>
                            {m.id === userId && <span className="text-xs text-neutral-500">(you)</span>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {m.id !== userId && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`${basePath}/messages`, { state: { openUserId: m.id, openUserName: m.name } })}
                                >
                                  <MessageCircle className="h-3 w-3 mr-1" />
                                  Message
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`${basePath}/profile/${m.id}`)}
                                >
                                  View profile
                                </Button>
                              </>
                            )}
                            {isAdmin && m.id !== userId && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditCodes(m.id, m.name)}
                                  title="Edit course codes"
                                >
                                  <KeyRound className="h-3 w-3 mr-1" />
                                  Codes
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeMemberFromCourse(course.id, m.id)}
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={!!editingCodesForId}
        onClose={() => setEditingCodesForId(null)}
        title="Course codes"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Select which course codes <strong>{editingCodesName}</strong> can access. They will see only courses and resources for these codes.
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {allCourseCodes.length === 0 ? (
              <p className="text-sm text-neutral-500">No course codes yet. Create courses with codes in the Course tab.</p>
            ) : (
              allCourseCodes.map((code) => (
                <label key={code} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draftCourseCodes.includes(code)}
                    onChange={() => toggleDraftCode(code)}
                    className="rounded border-neutral-300 text-primary-600"
                  />
                  <span className="font-medium text-neutral-800">{code}</span>
                </label>
              ))
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditingCodesForId(null)}>Cancel</Button>
            <Button onClick={saveCourseCodes} disabled={savingCodes}>{savingCodes ? 'Saving…' : 'Save'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CourseMembers;
