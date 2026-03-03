import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import Input, { TextArea } from '../components/Input';
import { quizService } from '../services/quizService';
import { courseService } from '../services/courseService';
import type { Quiz, QuizQuestion } from '../types/quiz';
import type { Course } from '../types/course';
import { ClipboardList, Plus, Trash2, Pencil, ArrowLeft, Loader2, GripVertical } from 'lucide-react';

function newTempId(): string {
  return 'tmp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

type QuestionDraft = {
  tempId: string;
  type: 'multiple_choice' | 'short_answer';
  question: string;
  options: string[];
  correctIndex: number;
  correctAnswer: string;
  order: number;
};

const AdminQuizzes: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [quizList, courseList] = await Promise.all([
        quizService.getAll(),
        courseService.fetchCourses().catch(() => []),
      ]);
      setQuizzes(quizList);
      setCourses(courseList);
    };
    load();
  }, []);

  const startNew = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setCourseId('');
    setPassingScore(70);
    setQuestions([]);
    setShowForm(true);
  };

  const startEdit = (quiz: Quiz) => {
    setEditingId(quiz.id);
    setTitle(quiz.title);
    setDescription(quiz.description || '');
    setCourseId(quiz.courseId || '');
    setPassingScore(quiz.passingScore ?? 70);
    setQuestions(
      (quiz.questions || []).map((q, i) => ({
        tempId: q.id,
        type: q.type,
        question: q.question,
        options: q.options || [],
        correctIndex: q.correctIndex ?? 0,
        correctAnswer: q.correctAnswer || '',
        order: q.order ?? i + 1,
      }))
    );
    setShowForm(true);
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        tempId: newTempId(),
        type: 'multiple_choice',
        question: '',
        options: ['', ''],
        correctIndex: 0,
        correctAnswer: '',
        order: questions.length + 1,
      },
    ]);
  };

  const updateQuestion = (tempId: string, patch: Partial<QuestionDraft>) => {
    setQuestions((prev) => prev.map((q) => (q.tempId === tempId ? { ...q, ...patch } : q)));
  };

  const removeQuestion = (tempId: string) => {
    setQuestions((prev) => prev.filter((q) => q.tempId !== tempId));
  };

  const setQuestionOption = (tempId: string, index: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.tempId !== tempId) return q;
        const opts = [...(q.options || [])];
        opts[index] = value;
        return { ...q, options: opts };
      })
    );
  };

  const addOption = (tempId: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.tempId === tempId ? { ...q, options: [...(q.options || []), ''] } : q))
    );
  };

  const removeOption = (tempId: string, index: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.tempId !== tempId) return q;
        const opts = (q.options || []).filter((_, i) => i !== index);
        return { ...q, options: opts, correctIndex: Math.min(q.correctIndex, Math.max(0, opts.length - 1)) };
      })
    );
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const quiz: Quiz = {
        id: editingId || quizService.generateId(),
        title: title.trim(),
        description: description.trim() || undefined,
        courseId: courseId.trim() || undefined,
        passingScore: passingScore,
        questions: questions.map((q, i) => {
          const base: QuizQuestion = {
            id: q.tempId.startsWith('tmp-') ? quizService.generateId() : q.tempId,
            type: q.type,
            question: q.question.trim(),
            order: i + 1,
          };
          if (q.type === 'multiple_choice') {
            base.options = q.options.filter((o) => o.trim());
            base.correctIndex = q.correctIndex;
          } else {
            base.correctAnswer = q.correctAnswer.trim();
          }
          return base;
        }),
        createdAt: editingId ? (quizzes.find((q) => q.id === editingId)?.createdAt ?? new Date().toISOString()) : new Date().toISOString(),
      };
      await quizService.save(quiz);
      const list = await quizService.getAll();
      setQuizzes(list);
      setShowForm(false);
      startNew();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this quiz? This cannot be undone.')) {
      await quizService.delete(id);
      const list = await quizService.getAll();
      setQuizzes(list);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center">
        <ClipboardList className="h-8 w-8 text-primary-600 mr-3 shrink-0" />
        <div>
          <h1 className="text-3xl font-bold text-neutral-800">Quizzes</h1>
          <p className="text-neutral-600 mt-1">Create and edit quizzes. Students can take them from the Quizzes page.</p>
        </div>
      </div>

      {!showForm ? (
        <>
          <Button className="mb-6" onClick={startNew}>
            <Plus className="h-4 w-4 mr-2" />
            Create quiz
          </Button>
          <div className="space-y-4">
            {quizzes.map((q) => (
              <Card key={q.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-neutral-800">{q.title}</h3>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      {q.questions?.length ?? 0} question{(q.questions?.length ?? 0) !== 1 ? 's' : ''}
                      {q.courseId ? ` · Course: ${courses.find((c) => c.id === q.courseId)?.title ?? q.courseId}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => startEdit(q)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(q.id)} className="text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-neutral-800">{editingId ? 'Edit quiz' : 'New quiz'}</h2>
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>

            <div className="space-y-6">
              <Input label="Quiz title" placeholder="e.g. Week 1 Knowledge Check" value={title} onChange={(e) => setTitle(e.target.value)} />
              <TextArea label="Description (optional)" placeholder="Brief description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Course (optional)</label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
                  >
                    <option value="">— None —</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Passing score (%)"
                  type="number"
                  min={0}
                  max={100}
                  value={String(passingScore)}
                  onChange={(e) => setPassingScore(Number(e.target.value) || 70)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-neutral-800">Questions</span>
                  <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add question
                  </Button>
                </div>
                {questions.length === 0 && <p className="text-sm text-neutral-500 mb-3">Add at least one question.</p>}
                <div className="space-y-6">
                  {questions.map((q, idx) => (
                    <div key={q.tempId} className="border border-neutral-200 rounded-lg p-4 bg-neutral-50/50">
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-5 w-5 text-neutral-400 mt-1 shrink-0" />
                        <div className="flex-1 space-y-3">
                          <div className="flex gap-2 items-center">
                            <select
                              value={q.type}
                              onChange={(e) => updateQuestion(q.tempId, { type: e.target.value as QuestionDraft['type'] })}
                              className="rounded border border-neutral-300 px-2 py-1 text-sm"
                            >
                              <option value="multiple_choice">Multiple choice</option>
                              <option value="short_answer">Short answer</option>
                            </select>
                            <span className="text-sm text-neutral-500">Question {idx + 1}</span>
                          </div>
                          <Input
                            placeholder="Question text"
                            value={q.question}
                            onChange={(e) => updateQuestion(q.tempId, { question: e.target.value })}
                          />
                          {q.type === 'multiple_choice' && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-neutral-600">Options (select correct one)</p>
                              {(q.options || []).map((opt, oi) => (
                                <div key={oi} className="flex gap-2 items-center">
                                  <input
                                    type="radio"
                                    name={`correct-${q.tempId}`}
                                    checked={q.correctIndex === oi}
                                    onChange={() => updateQuestion(q.tempId, { correctIndex: oi })}
                                    className="rounded border-neutral-300"
                                  />
                                  <Input
                                    placeholder={`Option ${oi + 1}`}
                                    value={opt}
                                    onChange={(e) => setQuestionOption(q.tempId, oi, e.target.value)}
                                    className="flex-1"
                                  />
                                  <Button type="button" variant="outline" size="sm" onClick={() => removeOption(q.tempId, oi)} className="text-red-600 shrink-0">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button type="button" variant="outline" size="sm" onClick={() => addOption(q.tempId)}>
                                <Plus className="h-4 w-4 mr-1" />
                                Add option
                              </Button>
                            </div>
                          )}
                          {q.type === 'short_answer' && (
                            <Input
                              label="Correct answer (exact match)"
                              placeholder="Expected answer"
                              value={q.correctAnswer}
                              onChange={(e) => updateQuestion(q.tempId, { correctAnswer: e.target.value })}
                            />
                          )}
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => removeQuestion(q.tempId)} className="text-red-600 shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} disabled={saving || !title.trim()}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save quiz
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminQuizzes;
