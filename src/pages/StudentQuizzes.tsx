import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import Input from '../components/Input';
import { quizService } from '../services/quizService';
import { useAuth } from '../context/useAuth';
import type { Quiz, QuizCompletion } from '../types/quiz';
import { ClipboardList, CheckCircle, XCircle, ArrowLeft, Loader2, CreditCard, AlertCircle } from 'lucide-react';
import { getErrorMessage } from '../utils/apiError';

type View = 'list' | 'take' | 'result';

const StudentQuizzes: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [completions, setCompletions] = useState<Record<string, QuizCompletion | null>>({});
  const [view, setView] = useState<View>('list');
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<QuizCompletion | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const list = await quizService.getAll();
        if (cancelled) return;
        setQuizzes(list);

        const comps: Record<string, QuizCompletion | null> = {};
        await Promise.all(
          list.map(async (q) => {
            try {
              comps[q.id] = await quizService.getCompletion(q.id, userId);
            } catch {
              comps[q.id] = null;
            }
          })
        );
        if (!cancelled) setCompletions(comps);
      } catch (e) {
        if (!cancelled) {
          setQuizzes([]);
          setLoadError(getErrorMessage(e, 'Could not load quizzes.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [userId]);

  const startQuiz = (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setAnswers({});
    setLastResult(null);
    setView('take');
  };

  const setAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const submitQuiz = async () => {
    if (!currentQuiz || !userId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await quizService.submitQuiz(currentQuiz.id, userId, answers);
      setLastResult(result);
      setCompletions((prev) => ({ ...prev, [currentQuiz.id]: result }));
      setView('result');
    } catch (e) {
      setSubmitError(getErrorMessage(e, 'Could not submit your answers.'));
    } finally {
      setSubmitting(false);
    }
  };

  const backToList = () => {
    setView('list');
    setCurrentQuiz(null);
    setLastResult(null);
    setAnswers({});
  };

  if (view === 'take' && currentQuiz) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={backToList}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to quizzes
          </Button>
        </div>
        <Card className="mb-6">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold text-neutral-800 mb-2">{currentQuiz.title}</h1>
            {currentQuiz.description && <p className="text-neutral-600 mb-6">{currentQuiz.description}</p>}
            {submitError ? (
              <div className="mb-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            ) : null}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitQuiz();
              }}
              className="space-y-6"
            >
              {(currentQuiz.questions || []).map((q, idx) => (
                <div key={q.id} className="border-b border-neutral-100 pb-6 last:border-0">
                  <p className="font-medium text-neutral-800 mb-2">
                    {idx + 1}. {q.question}
                  </p>
                  {q.type === 'multiple_choice' && q.options && (
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => (
                        <label key={oi} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={q.id}
                            value={opt}
                            checked={(answers[q.id] ?? '') === opt}
                            onChange={() => setAnswer(q.id, opt)}
                            className="rounded border-neutral-300 text-accent-teal focus:ring-accent-teal"
                          />
                          <span className="text-neutral-700">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {q.type === 'short_answer' && (
                    <Input
                      placeholder="Your answer"
                      value={answers[q.id] ?? ''}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      className="max-w-md"
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Submit quiz
                </Button>
                <Button type="button" variant="outline" onClick={backToList}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === 'result' && lastResult && currentQuiz) {
    const passingScore = currentQuiz.passingScore ?? 70;
    return (
      <div>
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              {lastResult.passed ? (
                <CheckCircle className="h-10 w-10 text-green-600" />
              ) : (
                <XCircle className="h-10 w-10 text-red-600" />
              )}
              <div>
                <h1 className="text-2xl font-bold text-neutral-800">{currentQuiz.title} — Result</h1>
                <p className="text-neutral-600">
                  Score: {lastResult.score}% ({lastResult.passed ? 'Passed' : 'Not passed'} — passing is {passingScore}%)
                </p>
              </div>
            </div>
            <p className="text-neutral-700 mb-6">
              {lastResult.passed
                ? 'You passed this quiz. Optionally pay to receive a certificate (see below).'
                : 'You did not reach the passing score. You can retake the quiz from the Quizzes list.'}
            </p>

            <div className="border border-neutral-200 rounded-lg p-6 bg-neutral-50">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-neutral-600" />
                <h2 className="text-lg font-semibold text-neutral-800">Pay to certify</h2>
              </div>
              <p className="text-sm text-neutral-600 mb-4">
                Once payment is integrated, you can pay (crypto or other) to receive an official certificate for this quiz. This is a placeholder — no payment is processed yet.
              </p>
              <Button variant="outline" disabled className="opacity-75 cursor-not-allowed">
                Payment coming soon
              </Button>
            </div>

            <div className="mt-6">
              <Button variant="outline" onClick={backToList}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to quizzes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center">
        <ClipboardList className="h-8 w-8 text-primary-600 mr-3 shrink-0" />
        <div>
          <h1 className="text-3xl font-bold text-neutral-800">Quizzes</h1>
          <p className="text-neutral-600 mt-1">Take quizzes and track your results. Pay to certify when available.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      ) : loadError ? (
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Could not load quizzes</p>
            <p className="text-sm mt-1">{loadError}</p>
          </div>
        </div>
      ) : quizzes.length === 0 ? (
        <p className="text-neutral-600">No quizzes available yet. Check back later.</p>
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => {
            const completion = completions[quiz.id] ?? null;
            return (
              <Card key={quiz.id}>
                <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-semibold text-neutral-800">{quiz.title}</h3>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      {quiz.questions?.length ?? 0} question{(quiz.questions?.length ?? 0) !== 1 ? 's' : ''}
                      {completion ? ` · Score: ${completion.score}% (${completion.passed ? 'Passed' : 'Not passed'})` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {completion ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => startQuiz(quiz)}>
                          Retake quiz
                        </Button>
                        <span className="inline-flex items-center text-sm text-neutral-600">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                          Completed
                        </span>
                      </>
                    ) : (
                      <Button size="sm" onClick={() => startQuiz(quiz)}>
                        Take quiz
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentQuizzes;
