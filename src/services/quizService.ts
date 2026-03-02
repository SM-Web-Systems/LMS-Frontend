/**
 * Quiz service: CRUD for quizzes and completions.
 * Uses localStorage; replace with API when backend is ready.
 */

import type { Quiz, QuizCompletion } from '../types/quiz';

const QUIZ_STORAGE = 'lms_quizzes';
const COMPLETION_STORAGE = 'lms_quiz_completions';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function loadQuizzes(): Quiz[] {
  try {
    const raw = localStorage.getItem(QUIZ_STORAGE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveQuizzes(quizzes: Quiz[]) {
  localStorage.setItem(QUIZ_STORAGE, JSON.stringify(quizzes));
}

function loadCompletions(): QuizCompletion[] {
  try {
    const raw = localStorage.getItem(COMPLETION_STORAGE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCompletions(completions: QuizCompletion[]) {
  localStorage.setItem(COMPLETION_STORAGE, JSON.stringify(completions));
}

export const quizService = {
  getAll(): Quiz[] {
    return loadQuizzes();
  },

  getById(id: string): Quiz | null {
    return loadQuizzes().find((q) => q.id === id) ?? null;
  },

  save(quiz: Quiz): Quiz {
    const quizzes = loadQuizzes();
    const copy = { ...quiz, updatedAt: new Date().toISOString() };
    const idx = quizzes.findIndex((q) => q.id === quiz.id);
    if (idx >= 0) {
      quizzes[idx] = copy;
    } else {
      if (!copy.id) copy.id = generateId();
      copy.createdAt = copy.createdAt || new Date().toISOString();
      quizzes.unshift(copy);
    }
    saveQuizzes(quizzes);
    return copy;
  },

  delete(id: string): void {
    saveQuizzes(loadQuizzes().filter((q) => q.id !== id));
  },

  getCompletionsForUser(userId: string): QuizCompletion[] {
    return loadCompletions().filter((c) => c.userId === userId);
  },

  getCompletion(quizId: string, userId: string): QuizCompletion | null {
    return loadCompletions().find((c) => c.quizId === quizId && c.userId === userId) ?? null;
  },

  submitQuiz(quizId: string, userId: string, answers: Record<string, string>): QuizCompletion {
    const quiz = this.getById(quizId);
    if (!quiz) throw new Error('Quiz not found');
    let correct = 0;
    const total = quiz.questions.length;
    quiz.questions.forEach((q) => {
      const submitted = (answers[q.id] ?? '').trim();
      if (q.type === 'multiple_choice' && q.options && q.correctIndex !== undefined) {
        if (q.options[q.correctIndex] === submitted) correct += 1;
      } else if (q.type === 'short_answer' && q.correctAnswer) {
        if (submitted.toLowerCase() === q.correctAnswer.toLowerCase()) correct += 1;
      }
    });
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passingScore = quiz.passingScore ?? 70;
    const completion: QuizCompletion = {
      id: generateId(),
      quizId,
      userId,
      score,
      total,
      passed: score >= passingScore,
      answers,
      completedAt: new Date().toISOString(),
      paymentStatus: 'none',
    };
    const completions = loadCompletions();
    completions.push(completion);
    saveCompletions(completions);
    return completion;
  },

  generateId,
};
