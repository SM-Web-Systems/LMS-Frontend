import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import { Card, CardContent } from '../components/Card';
import { VideoPlayerModal } from '../components/VideoPlayerModal';
import { PdfViewer, PdfViewerWithAuth } from '../components/PdfViewer';
import { courseService } from '../services/courseService';
import { getErrorMessage } from '../utils/apiError';
import { getCourseWeeks, type CourseSection, type CourseItem } from '../types/course';
import type { Course } from '../types/course';
import { Play, ExternalLink, FileText, BookOpen, Target, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';

function getEmbedUrl(url: string): string {
  // Normalize YouTube URLs to embed format
  if (url.includes('youtube.com/embed/')) return url;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

function weekKey(courseId: string, weekId: string): string {
  return `${courseId}:${weekId}`;
}

const StudentCourse: React.FC = () => {
  const { user } = useAuth();
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

  const [expandedWeekKeys, setExpandedWeekKeys] = useState<Set<string>>(new Set());
  const [videoModal, setVideoModal] = useState<{ title: string; embedUrl: string } | null>(null);
  const [expandedPdfId, setExpandedPdfId] = useState<string | null>(null);

  const toggleWeek = (courseId: string, weekId: string) => {
    const key = weekKey(courseId, weekId);
    setExpandedWeekKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleVideoClick = (item: Extract<CourseItem, { type: 'video' }>) => {
    setVideoModal({ title: item.title, embedUrl: getEmbedUrl(item.url) });
  };

  const handleLinkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="mb-8">
        <BookOpen className="h-8 w-8 text-primary-600 mr-3 mb-4" />
        <h1 className="text-3xl font-bold text-neutral-800">My courses</h1>
        <p className="text-neutral-600 mt-2">Loading courses…</p>
      </div>
    );
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">My courses</h1>
        <p className="text-neutral-600 mt-1">Courses you’re enrolled in. Expand a week to see its sections and materials.</p>
      </div>

      {/* List of enrolled courses, each with collapsible weeks */}
      <div className="space-y-8">
        {courses.map((course: Course) => {
          const weeks = getCourseWeeks(course);
          return (
            <div key={course.id} className="rounded-xl border border-neutral-200 overflow-hidden bg-white shadow-sm">
              <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50/80">
                <h2 className="text-xl font-semibold text-neutral-800">{course.title}</h2>
                {course.description && (
                  <p className="text-neutral-600 text-sm mt-1 max-w-3xl">{course.description}</p>
                )}
              </div>
              <div className="p-4 space-y-2">
                {weeks.map((week) => {
                  const key = weekKey(course.id, week.id);
                  const isExpanded = expandedWeekKeys.has(key);
                  const sectionCount = week.sections.length;
                  return (
                    <div key={week.id} className="rounded-lg border border-neutral-200 overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() => toggleWeek(course.id, week.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-neutral-500 shrink-0" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-neutral-500 shrink-0" />
                        )}
                        <span className="font-semibold text-neutral-800">{week.title}</span>
                        <span className="text-sm text-neutral-500">
                          {sectionCount} section{sectionCount !== 1 ? 's' : ''}
                        </span>
                      </button>
                      {isExpanded && (
                        <div className="border-t border-neutral-200 bg-neutral-50/50">
                          <div className="p-4 space-y-6">
                            {week.sections.map((section) => (
                              <SectionBlock
                                key={section.id}
                                section={section}
                                onVideoClick={handleVideoClick}
                                onLinkClick={handleLinkClick}
                                expandedPdfId={expandedPdfId}
                                onTogglePdf={setExpandedPdfId}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
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

interface SectionBlockProps {
  section: CourseSection;
  onVideoClick: (item: Extract<CourseItem, { type: 'video' }>) => void;
  onLinkClick: (url: string) => void;
  expandedPdfId: string | null;
  onTogglePdf: (id: string | null) => void;
}

function SectionBlock({ section, onVideoClick, onLinkClick, expandedPdfId, onTogglePdf }: SectionBlockProps) {
  const hasItems = section.items.length > 0;
  const sortedItems = [...section.items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold text-neutral-800 mb-4 flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-accent-teal" />
          {section.title}
        </h2>

        {section.objective && (
          <div className="mb-4 flex gap-2">
            <Target className="h-5 w-5 text-neutral-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-neutral-600">Objective</p>
              <p className="text-neutral-700">{section.objective}</p>
            </div>
          </div>
        )}

        {hasItems && (
          <div className="space-y-3 mt-4">
            {sortedItems.map((item) => {
              if (item.type === 'video') {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onVideoClick(item)}
                    className="w-full flex items-center gap-4 p-4 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-accent-teal transition-colors text-left group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary-dark flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                      <Play className="h-6 w-6 ml-0.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-neutral-800">{item.title}</span>
                      {item.description && (
                        <p className="text-sm text-neutral-500 mt-0.5">{item.description}</p>
                      )}
                    </div>
                    <span className="text-sm text-accent-teal font-medium">Play</span>
                  </button>
                );
              }
              if (item.type === 'link') {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onLinkClick(item.url)}
                    className="w-full flex items-center gap-4 p-4 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-accent-teal transition-colors text-left group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 group-hover:bg-accent-teal group-hover:text-white transition-colors">
                      <ExternalLink className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-neutral-800">{item.title}</span>
                      {item.description && (
                        <p className="text-sm text-neutral-500 mt-0.5">{item.description}</p>
                      )}
                    </div>
                    <span className="text-sm text-accent-teal font-medium">Open</span>
                  </button>
                );
              }
              if (item.type === 'pdf') {
                // For documentId we use PdfViewerWithAuth to fetch with Bearer token; for fileUrl use URL directly
                const isExpanded = expandedPdfId === item.id;
                return (
                  <div key={item.id} className="rounded-lg border border-neutral-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => onTogglePdf(isExpanded ? null : item.id)}
                      className="w-full flex items-center gap-4 p-4 bg-white hover:bg-neutral-50 transition-colors text-left"
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-neutral-800">{item.title}</span>
                        {item.description && (
                          <p className="text-sm text-neutral-500 mt-0.5">{item.description}</p>
                        )}
                      </div>
                      <span className="text-sm text-accent-teal font-medium">
                        {isExpanded ? 'Hide' : 'View PDF'}
                      </span>
                    </button>
                    {isExpanded && (
                      item.documentId ? (
                        <PdfViewerWithAuth documentId={item.documentId} title={item.title} className="rounded-none border-t" />
                      ) : item.fileUrl ? (
                        <PdfViewer title={item.title} src={item.fileUrl} className="rounded-none border-t" />
                      ) : null
                    )}
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}

        {section.outcome && (
          <div className="mt-4 pt-4 border-t border-neutral-200 flex gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-neutral-600">Outcome</p>
              <p className="text-neutral-700">{section.outcome}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StudentCourse;
