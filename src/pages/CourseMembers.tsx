import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { courseService } from '../services/courseService';
import { userDirectoryService } from '../services/userDirectoryService';
import { usersService, UserDirectoryItem } from '../services/usersService';
import { inviteService, type InviteResult, type PendingInvite } from '../services/inviteService';
import type { Course } from '../types/course';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import {
  Users, MessageCircle, Plus, Trash2, KeyRound, Info, Loader2, GraduationCap,
  Mail, Upload, Download, CheckCircle2, AlertCircle, Clock, X,
} from 'lucide-react';
import { getErrorMessage } from '../utils/apiError';

type Member = { id: string; name: string; email: string };

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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

  // Bulk invite state
  const [inviteCourseId, setInviteCourseId] = useState<string | null>(null);
  const [inviteText, setInviteText] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [pendingInvitesByCourse, setPendingInvitesByCourse] = useState<Record<string, PendingInvite[]>>({});
  const csvFileRef = useRef<HTMLInputElement>(null);

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
      alert(getErrorMessage(e, 'Could not save course codes.'));
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
      alert(getErrorMessage(e, 'Could not add that member.'));
    }
  };

  const removeMemberFromCourse = async (courseId: string, memberId: string) => {
    try {
      await courseService.removeCourseMember(courseId, memberId);
      await loadMembersForCourse(courseId);
      await loadUsers();
    } catch (e) {
      console.error(e);
      alert(getErrorMessage(e, 'Could not remove that member.'));
    }
  };

  const loadPendingInvites = useCallback(async (courseId: string) => {
    if (!isAdmin) return;
    try {
      const invites = await inviteService.getPendingInvites(courseId);
      setPendingInvitesByCourse((prev) => ({ ...prev, [courseId]: invites }));
    } catch {
      // ignore
    }
  }, [isAdmin]);

  const openInviteModal = (courseId: string) => {
    setInviteCourseId(courseId);
    setInviteText('');
    setInviteResult(null);
    setInviteError(null);
    loadPendingInvites(courseId);
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const emails = await inviteService.parseCSVFile(file);
    setInviteText((prev) => {
      const existing = inviteService.parseEmailsFromText(prev);
      const merged = [...new Set([...existing, ...emails])];
      return merged.join('\n');
    });
    if (csvFileRef.current) csvFileRef.current.value = '';
  };

  const handleBulkInvite = async () => {
    if (!inviteCourseId || !inviteText.trim()) return;
    const emails = inviteService.parseEmailsFromText(inviteText);
    if (emails.length === 0) {
      setInviteError('No valid email addresses found.');
      return;
    }
    setInviting(true);
    setInviteResult(null);
    setInviteError(null);
    try {
      const result = await inviteService.bulkInvite(inviteCourseId, emails);
      setInviteResult(result);
      setInviteText('');
      // Reload members + invites
      await loadMembersForCourse(inviteCourseId);
      await loadPendingInvites(inviteCourseId);
    } catch (e) {
      setInviteError(getErrorMessage(e, 'Could not process the invite list.'));
    } finally {
      setInviting(false);
    }
  };

  const revokeInvite = async (courseId: string, inviteId: string) => {
    try {
      await inviteService.revokeInvite(courseId, inviteId);
      await loadPendingInvites(courseId);
    } catch {
      // ignore
    }
  };

  const basePath = user?.role === 'admin' ? '/admin' : '/student';

  return (
    <div className="pb-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-teal/15 text-accent-teal ring-1 ring-accent-teal/20">
            <Users className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 tracking-tight">Course members</h1>
            <p className="text-neutral-600 mt-1 max-w-2xl leading-relaxed">
              {isAdmin
                ? 'Roster and access for each course. Add people from your directory or adjust course codes for a member.'
                : 'Everyone enrolled with you. Reach out or open a profile from here.'}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-neutral-200/90 bg-white shadow-card">
          <Loader2 className="h-9 w-9 animate-spin text-accent-teal" aria-hidden />
          <p className="mt-3 text-sm text-neutral-600">Loading courses and rosters…</p>
        </div>
      ) : coursesToShow.length === 0 ? (
        <Card className="shadow-updraft overflow-hidden">
          <div className="border-b border-neutral-200/90 bg-gradient-to-r from-primary-50/90 via-white to-neutral-50/80 px-6 py-4">
            <div className="flex items-center gap-2 text-primary-dark">
              <GraduationCap className="h-5 w-5 text-accent-teal shrink-0" aria-hidden />
              <p className="text-sm font-semibold">No courses to show</p>
            </div>
          </div>
          <CardContent className="p-8 text-center">
            <p className="text-neutral-600 max-w-md mx-auto leading-relaxed">
              {isAdmin
                ? 'Create a course from the Course tab, then return here to add members.'
                : "You don't have access to any courses yet. Your admin can assign course codes or add you to a roster."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {coursesToShow.map((course) => {
            const members = getMembersForCourse(course.id);
            const isManaging = managingCourseId === course.id;
            const memberIds = new Set(members.map((m) => m.id));
            const availableUsers = allUsers.filter((u) => !memberIds.has(u.id));

            return (
              <Card key={course.id} className="shadow-updraft overflow-hidden ring-1 ring-neutral-900/[0.04]">
                <div className="border-b border-neutral-200/90 bg-gradient-to-r from-accent-teal/[0.07] via-white to-neutral-50/90 px-5 py-4 sm:px-6 sm:py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex items-start gap-3">
                      <span className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/80 text-accent-teal shadow-sm ring-1 ring-neutral-200/80">
                        <GraduationCap className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl font-semibold text-neutral-800 truncate">{course.title}</h2>
                        {course.courseCode ? (
                          <p className="text-sm text-neutral-500 mt-0.5">
                            Code{' '}
                            <span className="font-mono text-neutral-700 bg-white/70 px-1.5 py-0.5 rounded-md ring-1 ring-neutral-200/80">
                              {course.courseCode}
                            </span>
                          </p>
                        ) : null}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                          onClick={() => openInviteModal(course.id)}
                        >
                          <Mail className="h-3.5 w-3.5 mr-1" />
                          Invite / CSV
                        </Button>
                        <Button
                          variant={isManaging ? 'primary' : 'outline'}
                          size="sm"
                          className="shrink-0"
                          onClick={() => setManagingCourseId(isManaging ? null : course.id)}
                        >
                          {isManaging ? 'Done adding' : 'Manage members'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <CardContent className="p-5 sm:p-6 space-y-5">
                  {isManaging && availableUsers.length > 0 && (
                    <div className="rounded-xl border border-sky-200/80 bg-sky-50/60 px-4 py-4 sm:px-5 ring-1 ring-sky-900/[0.04]">
                      <div className="flex gap-3 items-start">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-teal/15 text-accent-teal">
                          <Info className="h-5 w-5" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Add to this course</p>
                          <p className="text-sm text-neutral-700 mt-1 leading-relaxed">
                            Tap a person to enroll them immediately. They must already exist in your user directory.
                          </p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {availableUsers.map((u) => (
                              <Button
                                key={u.id}
                                variant="outline"
                                size="sm"
                                className="border-neutral-200/90 bg-white/90 hover:bg-white shadow-sm"
                                onClick={() => addMemberToCourse(course.id, u)}
                              >
                                <Plus className="h-3.5 w-3.5 mr-1 text-accent-teal" aria-hidden />
                                <span className="font-medium">{u.name}</span>
                                <span className="ml-1.5 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-800">
                                  {u.role}
                                </span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {isManaging && availableUsers.length === 0 && allUsers.length > 0 ? (
                    <p className="text-sm text-neutral-600 rounded-lg border border-neutral-200/80 bg-neutral-50/80 px-4 py-3">
                      Everyone in the directory is already in this course, or there are no other users to add.
                    </p>
                  ) : null}

                  {/* Pending invitations badge */}
                  {isAdmin && (pendingInvitesByCourse[course.id] ?? []).length > 0 && (
                    <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 space-y-2">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        Pending invitations ({pendingInvitesByCourse[course.id].length})
                      </p>
                      <ul className="space-y-1">
                        {pendingInvitesByCourse[course.id].map((inv) => (
                          <li key={inv.id} className="flex items-center justify-between gap-2 text-sm text-amber-900">
                            <span className="truncate">{inv.email}</span>
                            <button
                              type="button"
                              onClick={() => revokeInvite(course.id, inv.id)}
                              className="shrink-0 p-0.5 rounded hover:bg-amber-200/60 text-amber-700"
                              title="Revoke invite"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {members.length === 0 ? (
                    <p className="text-sm text-neutral-600 rounded-lg border border-dashed border-neutral-300/90 bg-neutral-50/50 px-4 py-6 text-center">
                      No members yet.
                      {isAdmin ? ' Use the Invite / CSV button to add people.' : ''}
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {members.map((m) => (
                        <li
                          key={m.id}
                          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-neutral-200/90 bg-white px-4 py-3 shadow-sm ring-1 ring-neutral-900/[0.03] hover:shadow-md hover:ring-neutral-900/[0.05] transition-shadow"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200/80 text-primary-dark text-xs font-bold ring-2 ring-white shadow-sm"
                              aria-hidden
                            >
                              {initials(m.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-neutral-800 truncate">{m.name}</span>
                                {m.id === userId ? (
                                  <span className="text-[10px] font-semibold uppercase tracking-wide text-accent-teal bg-accent-teal/10 px-2 py-0.5 rounded-full">
                                    You
                                  </span>
                                ) : null}
                              </div>
                              {m.email ? (
                                <p className="text-xs text-neutral-500 truncate mt-0.5">{m.email}</p>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:justify-end shrink-0">
                            {m.id !== userId && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-neutral-200/90"
                                  onClick={() =>
                                    navigate(`${basePath}/messages`, {
                                      state: { openUserId: m.id, openUserName: m.name },
                                    })
                                  }
                                >
                                  <MessageCircle className="h-3.5 w-3.5 mr-1" aria-hidden />
                                  Message
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-neutral-200/90"
                                  onClick={() => navigate(`${basePath}/profile/${m.id}`)}
                                >
                                  Profile
                                </Button>
                              </>
                            )}
                            {isAdmin && m.id !== userId && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-neutral-200/90"
                                  onClick={() => openEditCodes(m.id, m.name)}
                                  title="Edit course codes"
                                >
                                  <KeyRound className="h-3.5 w-3.5 mr-1" aria-hidden />
                                  Codes
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeMemberFromCourse(course.id, m.id)}
                                  className="text-red-600 border-red-200/90 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
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
          <div className="rounded-lg border border-sky-200/70 bg-sky-50/50 px-3 py-3 text-sm text-neutral-700 leading-relaxed">
            Select which codes <strong className="text-neutral-900">{editingCodesName}</strong> can use. Course content
            and resources filter by these codes.
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {allCourseCodes.length === 0 ? (
              <p className="text-sm text-neutral-500 py-2">No course codes yet. Add codes when you create courses.</p>
            ) : (
              allCourseCodes.map((code) => (
                <label
                  key={code}
                  className="flex items-center gap-3 cursor-pointer rounded-lg border border-neutral-200/90 bg-white px-3 py-2.5 hover:bg-neutral-50/90 has-[:checked]:border-accent-teal/40 has-[:checked]:bg-accent-teal/[0.04]"
                >
                  <input
                    type="checkbox"
                    checked={draftCourseCodes.includes(code)}
                    onChange={() => toggleDraftCode(code)}
                    className="rounded border-neutral-300 text-accent-teal focus:ring-accent-teal"
                  />
                  <span className="font-medium text-neutral-800 font-mono text-sm">{code}</span>
                </label>
              ))
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200/80">
            <Button variant="outline" onClick={() => setEditingCodesForId(null)}>
              Cancel
            </Button>
            <Button onClick={saveCourseCodes} disabled={savingCodes}>
              {savingCodes ? 'Saving…' : 'Save access'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk invite / CSV modal */}
      <Modal
        isOpen={!!inviteCourseId}
        onClose={() => { setInviteCourseId(null); setInviteResult(null); setInviteError(null); }}
        title="Invite members"
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-sky-200/70 bg-sky-50/50 px-3 py-3 text-sm text-neutral-700 leading-relaxed">
            <p className="font-medium text-neutral-800 mb-1 flex items-center gap-1.5">
              <Mail className="h-4 w-4 text-accent-teal" />
              Enroll by email
            </p>
            <p>
              Enter email addresses separated by commas or new lines. Existing accounts are enrolled immediately.
              New emails receive an invitation to sign up — they'll be auto-enrolled when they register.
            </p>
          </div>

          {/* Text area */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Email addresses
            </label>
            <textarea
              rows={5}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent-teal/30 focus:border-accent-teal/50"
              placeholder={"alice@example.com\nbob@example.com, charlie@example.com"}
              value={inviteText}
              onChange={(e) => setInviteText(e.target.value)}
            />
          </div>

          {/* CSV upload + template */}
          <div className="flex flex-wrap gap-2">
            <input
              type="file"
              accept=".csv,text/csv"
              ref={csvFileRef}
              className="hidden"
              onChange={handleCSVUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => csvFileRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5 mr-1" />
              Upload CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inviteService.downloadTemplate()}
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              Download CSV template
            </Button>
          </div>
          <p className="text-xs text-neutral-500">
            CSV format: <code className="bg-neutral-100 px-1 rounded">Name,Email</code> — one row per person. The Email column is required.
          </p>

          {/* Error */}
          {inviteError && (
            <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{inviteError}</span>
            </div>
          )}

          {/* Result */}
          {inviteResult && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 space-y-1 text-sm">
              <p className="font-semibold text-green-800 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Done!
              </p>
              {inviteResult.enrolled.length > 0 && (
                <p className="text-green-700">
                  ✓ Enrolled immediately ({inviteResult.enrolled.length}): {inviteResult.enrolled.join(', ')}
                </p>
              )}
              {inviteResult.invited.length > 0 && (
                <p className="text-amber-700">
                  ✉ Invitation sent ({inviteResult.invited.length}): {inviteResult.invited.join(', ')}
                </p>
              )}
              {inviteResult.alreadyEnrolled.length > 0 && (
                <p className="text-neutral-500">
                  Already enrolled / invited ({inviteResult.alreadyEnrolled.length}): {inviteResult.alreadyEnrolled.join(', ')}
                </p>
              )}
              {inviteResult.errors.length > 0 && (
                <p className="text-red-600">
                  Failed ({inviteResult.errors.length}): {inviteResult.errors.join(', ')}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200/80">
            <Button
              variant="outline"
              onClick={() => { setInviteCourseId(null); setInviteResult(null); setInviteError(null); }}
            >
              {inviteResult ? 'Close' : 'Cancel'}
            </Button>
            {!inviteResult && (
              <Button
                onClick={handleBulkInvite}
                disabled={inviting || !inviteText.trim()}
              >
                {inviting ? (
                  <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Processing…</>
                ) : (
                  <><Mail className="h-4 w-4 mr-1.5" />Send invitations</>
                )}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CourseMembers;
