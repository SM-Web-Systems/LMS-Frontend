import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Card, CardContent } from '../components/Card';
import { VideoPlayerModal } from '../components/VideoPlayerModal';
import { PdfViewer, PdfViewerWithAuth } from '../components/PdfViewer';
import { courseService } from '../services/courseService';
import { getErrorMessage } from '../utils/apiError';
import { getCourseWeeks, type CourseSection, type CourseItem } from '../types/course';
import type { Course } from '../types/course';
import { Play, ExternalLink, FileText, BookOpen, Target, CheckCircle, ChevronDown } from 'lucide-react';

function getEmbedUrl(url: string): string {
  if (url.includes('youtube.com/embed/')) return url;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

const STORAGE_PREFIX = 'lms:studentCourseView:';

function courseViewStorageKey(userId: string | undefined) {
  return `${STORAGE_PREFIX}${userId ?? 'anon'}`;
}

type StoredCourseView = { courseId: string; weekId: string | null };

function readStoredCourseView(userId: string | undefined): StoredCourseView | null {
  try {
    const raw = localStorage.getItem(courseViewStorageKey(userId));
    if (!raw) return null;
    const j = JSON.parse(raw) as unknown;
    if (!j || typeof j !== 'object') return null;
    const courseId = (j as { courseId?: unknown }).courseId;
    const weekId = (j as { weekId?: unknown }).weekId;
    if (typeof courseId !== 'string') return null;
    return {
      courseId,
      weekId: typeof weekId === 'string' ? weekId : null,
    };
  } catch {
    return null;
  }
}

function writeStoredCourseView(userId: string | undefined, courseId: string, weekId: string | null) {
  try {
    localStorage.setItem(courseViewStorageKey(userId), JSON.stringify({ courseId, weekId }));
  } catch {
    /* quota / private mode */
  }
}

function CoursePageSkeleton() {
  const pulse = 'animate-pulse rounded-md bg-neutral-200/80';
  return (
    <>
    <div className="mb-6 max-w-prose space-y-2" aria-busy="true" aria-label="Loading courses">
      <div className={`h-8 w-48 ${pulse}`} />
      <div className={`h-4 w-full max-w-md ${pulse}`} />
    </div>
    <div className="rounded-xl border border-neutral-200/90 bg-white shadow-card overflow-hidden flex flex-col min-h-[min(70vh,calc(100vh-8rem))] ring-1 ring-neutral-900/5">
      <div className="border-b border-neutral-200 bg-gradient-to-b from-white to-neutral-50/90 px-4 py-4 sm:px-5 space-y-3">
        <div className={`h-10 max-w-xl w-full ${pulse}`} />
        <div className={`h-4 max-w-prose w-full ${pulse}`} />
        <div className={`h-3 w-40 ${pulse}`} />
      </div>
      <div className="flex flex-1 min-h-[280px] flex-col lg:flex-row">
        <div className="hidden lg:flex lg:w-52 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50/90 p-3 gap-2">
          <div className={`h-3 w-12 ${pulse}`} />
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-14 w-full ${pulse}`} />
          ))}
        </div>
        <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-4 bg-neutral-50/50">
          <div className={`h-36 w-full max-w-2xl ${pulse}`} />
          <div className={`h-36 w-full max-w-2xl ${pulse}`} />
        </div>
      </div>
    </div>
    </>
  );
}

const StudentCourse: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const qCourse = searchParams.get('course');
  const qWeek = searchParams.get('week');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await courseService.fetchCourses();
      setCourses(list);
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load your courses.'));
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchCourses();
    else {
      setCourses([]);
      setLoading(false);
    }
  }, [user, fetchCourses]);

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
  const skipNextUrlSync = useRef(false);

  /** URL + localStorage → state; fix URL when invalid or empty. */
  useEffect(() => {
    if (loading || courses.length === 0) return;

    if (skipNextUrlSync.current) {
      skipNextUrlSync.current = false;
      return;
    }

    const stored = readStoredCourseView(user?.id);
    const hasCourseParam = qCourse != null && qCourse !== '';
    const courseValid = hasCourseParam && courses.some((c) => c.id === qCourse);

    let nextCourseId: string;
    if (courseValid) {
      nextCourseId = qCourse!;
    } else if (!hasCourseParam && stored?.courseId && courses.some((c) => c.id === stored.courseId)) {
      nextCourseId = stored.courseId;
    } else {
      nextCourseId = courses[0].id;
    }

    const courseObj = courses.find((c) => c.id === nextCourseId) ?? courses[0];
    const weeks = getCourseWeeks(courseObj);

    let nextWeekId: string | null = null;
    if (weeks.length > 0) {
      const hasWeekParam = qWeek != null && qWeek !== '';
      const weekValid = hasWeekParam && weeks.some((w) => w.id === qWeek);
      if (weekValid) {
        nextWeekId = qWeek!;
      } else if (
        !hasWeekParam &&
        stored?.courseId === nextCourseId &&
        stored.weekId &&
        weeks.some((w) => w.id === stored.weekId)
      ) {
        nextWeekId = stored.weekId;
      } else {
        nextWeekId = weeks[0].id;
      }
    }

    setSelectedCourseId((prev) => (prev === nextCourseId ? prev : nextCourseId));
    setSelectedWeekId((prev) => (prev === nextWeekId ? prev : nextWeekId));

    const urlCourse = qCourse;
    const urlWeek = qWeek ?? '';
    const targetWeek = nextWeekId ?? '';
    if (urlCourse !== nextCourseId || urlWeek !== targetWeek) {
      const p = new URLSearchParams();
      p.set('course', nextCourseId);
      if (nextWeekId) p.set('week', nextWeekId);
      else p.delete('week');
      setSearchParams(p, { replace: true });
    }

    writeStoredCourseView(user?.id, nextCourseId, nextWeekId);
  }, [loading, courses, qCourse, qWeek, user?.id, setSearchParams]);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) ?? courses[0],
    [courses, selectedCourseId]
  );

  const selectedWeeks = useMemo(
    () => (selectedCourse ? getCourseWeeks(selectedCourse) : []),
    [selectedCourse]
  );

  const activeWeek = selectedWeeks.find((w) => w.id === selectedWeekId) ?? selectedWeeks[0] ?? null;

  const pushCourseWeekToUrl = useCallback(
    (courseId: string, weekId: string | null) => {
      skipNextUrlSync.current = true;
      const p = new URLSearchParams(searchParams);
      p.set('course', courseId);
      if (weekId) p.set('week', weekId);
      else p.delete('week');
      setSearchParams(p, { replace: false });
      writeStoredCourseView(user?.id, courseId, weekId);
    },
    [searchParams, setSearchParams, user?.id]
  );

  const handleCourseChange = useCallback(
    (newCourseId: string) => {
      const c = courses.find((x) => x.id === newCourseId);
      const weeks = c ? getCourseWeeks(c) : [];
      const firstWeek = weeks[0]?.id ?? null;
      setSelectedCourseId(newCourseId);
      setSelectedWeekId(firstWeek);
      pushCourseWeekToUrl(newCourseId, firstWeek);
    },
    [courses, pushCourseWeekToUrl]
  );

  const handleWeekChange = useCallback(
    (weekId: string) => {
      if (!selectedCourseId) return;
      setSelectedWeekId(weekId);
      pushCourseWeekToUrl(selectedCourseId, weekId);
    },
    [selectedCourseId, pushCourseWeekToUrl]
  );

  const [videoModal, setVideoModal] = useState<{ title: string; embedUrl: string } | null>(null);
  const [expandedPdfId, setExpandedPdfId] = useState<string | null>(null);
  const [objectiveOpen, setObjectiveOpen] = useState<Record<string, boolean>>({});

  const handleVideoClick = (item: Extract<CourseItem, { type: 'video' }>) => {
    setVideoModal({ title: item.title, embedUrl: getEmbedUrl(item.url) });
  };

  const handleLinkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return <CoursePageSkeleton />;
  }

  if (error) {
    return (
      <div className="mb-8">
        <BookOpen className="h-8 w-8 text-primary-600 mr-3 mb-4" />
        <h1 className="text-3xl font-bold text-neutral-800">My courses</h1>
        <p className="text-neutral-600 mt-2 text-red-600">{error}</p>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="mb-8">
        <BookOpen className="h-8 w-8 text-primary-600 mr-3 mb-4" />
        <h1 className="text-3xl font-bold text-neutral-800">My courses</h1>
        <p className="text-neutral-600 mt-2">You are not enrolled in any courses yet. Contact your instructor to get access.</p>
      </div>
    );
  }

  const itemCountForWeek = (week: (typeof selectedWeeks)[0]) =>
    week.sections.reduce((n, s) => n + s.items.length, 0);

  return (
    <div>
      <div className="mb-6 max-w-prose">
        <h1 className="text-2xl font-bold text-neutral-800 tracking-tight">My courses</h1>
        <p className="text-neutral-600 mt-1.5 text-[15px] leading-relaxed">
          Pick a course and week below. The URL updates so you can bookmark or share your place in the course.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200/90 bg-white shadow-card overflow-hidden flex flex-col min-h-[min(70vh,calc(100vh-8rem))] ring-1 ring-neutral-900/5">
        {/* Sticky course header + course switcher */}
        <div className="sticky top-0 z-20 border-b border-neutral-200 bg-gradient-to-b from-white to-neutral-50/90 backdrop-blur-md px-4 py-4 sm:px-5">
          <label htmlFor="course-select" className="sr-only">
            Select course
          </label>
          <div className="max-w-xl">
            <select
              id="course-select"
              value={selectedCourseId ?? ''}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full rounded-lg border border-neutral-300/90 bg-white px-3 py-2.5 text-sm font-semibold text-primary-dark shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-teal/35 focus:border-accent-teal hover:border-neutral-400/80 transition-colors"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          {selectedCourse.description && (
            <p className="text-neutral-600 text-sm mt-3 max-w-prose leading-relaxed">{selectedCourse.description}</p>
          )}
          {activeWeek && (
            <p className="text-xs font-medium text-neutral-500 mt-2.5 tabular-nums">
              <span className="text-neutral-700">{activeWeek.title}</span>
              {itemCountForWeek(activeWeek) > 0
                ? ` · ${itemCountForWeek(activeWeek)} material${itemCountForWeek(activeWeek) !== 1 ? 's' : ''}`
                : null}
            </p>
          )}
        </div>

        {/* Mobile: horizontal week tabs */}
        {selectedWeeks.length > 0 && (
          <div className="lg:hidden border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-neutral-100/60 px-2 py-2.5">
            <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Weeks">
              {selectedWeeks.map((week) => {
                const active = week.id === selectedWeekId;
                const count = itemCountForWeek(week);
                return (
                  <button
                    key={week.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => handleWeekChange(week.id)}
                    className={[
                      'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all border',
                      active
                        ? 'bg-accent-teal/12 text-primary-dark border-accent-teal/45 shadow-sm ring-1 ring-accent-teal/20'
                        : 'bg-white/70 text-neutral-600 border-neutral-200/90 hover:bg-white hover:border-neutral-300',
                    ].join(' ')}
                  >
                    {week.title}
                    {count > 0 ? <span className="text-neutral-400 font-normal"> ({count})</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
          {/* Desktop: week rail */}
          {selectedWeeks.length > 0 && (
            <nav
              className="hidden lg:flex lg:w-52 xl:w-56 shrink-0 flex-col border-b lg:border-b-0 lg:border-r border-neutral-200 bg-gradient-to-b from-neutral-50 to-neutral-100/50"
              aria-label="Weeks"
            >
              <div className="p-3 text-[11px] font-semibold uppercase tracking-wide text-neutral-500 px-4 pt-4 pb-1">
                Weeks
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {selectedWeeks.map((week) => {
                  const active = week.id === selectedWeekId;
                  const count = itemCountForWeek(week);
                  return (
                    <button
                      key={week.id}
                      type="button"
                      onClick={() => handleWeekChange(week.id)}
                      className={[
                        'w-full text-left rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                        active
                          ? 'bg-accent-teal/10 text-primary-dark shadow-sm shadow-[inset_3px_0_0_0_#3d7a8c] border border-accent-teal/25 ring-1 ring-accent-teal/10'
                          : 'text-neutral-600 hover:bg-white/90 border border-transparent hover:border-neutral-200/60',
                      ].join(' ')}
                    >
                      <span className="block truncate">{week.title}</span>
                      <span className="block text-xs font-normal text-neutral-500 mt-0.5">
                        {week.sections.length} section{week.sections.length !== 1 ? 's' : ''}
                        {count > 0 ? ` · ${count} item${count !== 1 ? 's' : ''}` : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>
          )}

          {/* Section content */}
          <div className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-neutral-50/50">
            {selectedWeeks.length === 0 && (
              <p className="text-neutral-600 text-sm">This course does not have any weeks yet.</p>
            )}
            {activeWeek && activeWeek.sections.length === 0 && (
              <p className="text-neutral-600 text-sm max-w-prose">No sections in {activeWeek.title} yet.</p>
            )}
            {activeWeek && activeWeek.sections.length > 0 && (
              <div className="space-y-6 w-full max-w-6xl">
                {activeWeek.sections.map((section) => (
                  <SectionBlock
                    key={section.id}
                    section={section}
                    onVideoClick={handleVideoClick}
                    onLinkClick={handleLinkClick}
                    expandedPdfId={expandedPdfId}
                    onTogglePdf={setExpandedPdfId}
                    objectiveOpen={objectiveOpen[section.id] ?? false}
                    onToggleObjective={() =>
                      setObjectiveOpen((prev) => ({ ...prev, [section.id]: !prev[section.id] }))
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {videoModal && (
        <VideoPlayerModal
          isOpen={!!videoModal}
          onClose={() => setVideoModal(null)}
          title={videoModal.title}
          embedUrl={videoModal.embedUrl}
        />
      )}
    </div>
  );
};

/** Shared layout: fixed icon column, title stack, action — scans like a table. */
const MATERIAL_GRID =
  'grid grid-cols-[2.75rem_minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 items-center w-full text-left min-h-[3.25rem]';
const ICON_BOX = 'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm';

interface SectionBlockProps {
  section: CourseSection;
  onVideoClick: (item: Extract<CourseItem, { type: 'video' }>) => void;
  onLinkClick: (url: string) => void;
  expandedPdfId: string | null;
  onTogglePdf: (id: string | null) => void;
  objectiveOpen: boolean;
  onToggleObjective: () => void;
}

function SectionBlock({
  section,
  onVideoClick,
  onLinkClick,
  expandedPdfId,
  onTogglePdf,
  objectiveOpen,
  onToggleObjective,
}: SectionBlockProps) {
  const hasItems = section.items.length > 0;
  const sortedItems = [...section.items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const hasDetails = !!(section.objective || section.outcome);

  return (
    <Card className="shadow-card border-neutral-200/90 ring-1 ring-neutral-900/[0.04]">
      <CardContent className="p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-neutral-800 mb-4 flex items-center gap-2 tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-teal/10 text-accent-teal">
            <BookOpen className="h-5 w-5 shrink-0" />
          </span>
          {section.title}
        </h2>

        {section.objective && (
          <div className="mb-4">
            <button
              type="button"
              onClick={onToggleObjective}
              className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-primary-dark w-full text-left rounded-lg hover:bg-neutral-50 py-1 -mx-1 px-1 transition-colors"
            >
              <Target className="h-4 w-4 text-accent-teal/80 shrink-0" />
              <span>Objective</span>
              <ChevronDown
                className={`h-4 w-4 text-neutral-400 ml-auto transition-transform ${objectiveOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {objectiveOpen && (
              <p className="text-neutral-700 text-sm mt-2 max-w-prose leading-relaxed pl-6 border-l-2 border-accent-teal/30 ml-1">
                {section.objective}
              </p>
            )}
          </div>
        )}

        {hasItems && (
          <div className="mt-4 rounded-xl border border-neutral-200/90 bg-neutral-50/40 p-1.5 sm:p-2 space-y-1.5">
            {sortedItems.map((item) => {
              if (item.type === 'video') {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onVideoClick(item)}
                    className={`${MATERIAL_GRID} rounded-xl border border-neutral-200/90 bg-white px-3 py-2.5 hover:bg-neutral-50/90 hover:border-accent-teal/45 transition-all group shadow-sm`}
                  >
                    <div className={`${ICON_BOX} bg-primary-dark text-white group-hover:scale-[1.02] transition-transform`}>
                      <Play className="h-5 w-5 ml-0.5" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <span className="font-medium text-neutral-800 block leading-snug">{item.title}</span>
                      {item.description && (
                        <p className="text-sm text-neutral-500 mt-0.5 leading-snug line-clamp-2">{item.description}</p>
                      )}
                    </div>
                    <span className="text-sm text-accent-teal font-semibold shrink-0 tabular-nums">Play</span>
                  </button>
                );
              }
              if (item.type === 'link') {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onLinkClick(item.url)}
                    className={`${MATERIAL_GRID} rounded-xl border border-neutral-200/90 bg-white px-3 py-2.5 hover:bg-neutral-50/90 hover:border-accent-teal/45 transition-all group shadow-sm`}
                  >
                    <div
                      className={`${ICON_BOX} bg-neutral-100 text-neutral-600 group-hover:bg-accent-teal group-hover:text-white transition-colors`}
                    >
                      <ExternalLink className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <span className="font-medium text-neutral-800 block leading-snug">{item.title}</span>
                      {item.description && (
                        <p className="text-sm text-neutral-500 mt-0.5 leading-snug line-clamp-2">{item.description}</p>
                      )}
                    </div>
                    <span className="text-sm text-accent-teal font-semibold shrink-0">Open</span>
                  </button>
                );
              }
              if (item.type === 'pdf') {
                const isExpanded = expandedPdfId === item.id;
                return (
                  <div key={item.id} className="rounded-xl border border-neutral-200/90 overflow-hidden bg-white shadow-sm">
                    <button
                      type="button"
                      onClick={() => onTogglePdf(isExpanded ? null : item.id)}
                      className={`${MATERIAL_GRID} px-3 py-2.5 hover:bg-neutral-50/90 transition-colors w-full`}
                    >
                      <div className={`${ICON_BOX} bg-red-50 text-red-600 border border-red-100`}>
                        <FileText className="h-5 w-5" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <span className="font-medium text-neutral-800 block leading-snug">{item.title}</span>
                        {item.description && (
                          <p className="text-sm text-neutral-500 mt-0.5 leading-snug line-clamp-2">{item.description}</p>
                        )}
                      </div>
                      <span className="text-sm text-accent-teal font-semibold shrink-0">
                        {isExpanded ? 'Hide' : 'View PDF'}
                      </span>
                    </button>
                    {isExpanded &&
                      (item.documentId ? (
                        <PdfViewerWithAuth documentId={item.documentId} title={item.title} className="rounded-none border-t" />
                      ) : item.fileUrl ? (
                        <PdfViewer title={item.title} src={item.fileUrl} className="rounded-none border-t" />
                      ) : null)}
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}

        {section.outcome && (
          <div className="mt-5 pt-4 border-t border-neutral-200 flex gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" aria-hidden />
            <div className="min-w-0 max-w-prose">
              <p className="text-sm font-medium text-neutral-600">Outcome</p>
              <p className="text-neutral-700 leading-relaxed mt-0.5">{section.outcome}</p>
            </div>
          </div>
        )}

        {!hasItems && !hasDetails && (
          <p className="text-sm text-neutral-500">No materials in this section yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default StudentCourse;
