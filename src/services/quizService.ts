import api from './api';
import type { Quiz, QuizCompletion } from '../types/quiz';

export const quizService = {
  async getAll(): Promise<Quiz[]> {
    const res = await api.get<{ success: boolean; data: { quizzes: Quiz[] } }>('/quizzes');
    return res.data?.data?.quizzes ?? [];
  },

  async getById(id: string): Promise<Quiz | null> {
    try {
      const res = await api.get<{ success: boolean; data: Quiz }>(`/quizzes/${id}`);
      return res.data?.data ?? null;
    } catch {
      return null;
    }
  },

  async save(quiz: Quiz): Promise<Quiz> {
    const payload = {
      id: quiz.id || undefined,
      title: quiz.title,
      description: quiz.description,
      courseId: quiz.courseId,
      passingScore: quiz.passingScore,
      questions: quiz.questions,
    };

    if (quiz.id) {
      const res = await api.put<{ success: boolean; data: Quiz }>(`/quizzes/${quiz.id}`, payload);
      return res.data.data;
    }
    const res = await api.post<{ success: boolean; data: Quiz }>('/quizzes', payload);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/quizzes/${id}`);
  },

  async getCompletionsForUser(userId: string): Promise<QuizCompletion[]> {
    const res = await api.get<{ success: boolean; data: { completions: QuizCompletion[] } }>('/quizzes/completions', { params: { userId } });
    return res.data?.data?.completions ?? [];
  },

  async getCompletion(quizId: string, userId: string): Promise<QuizCompletion | null> {
    const res = await api.get<{ success: boolean; data: QuizCompletion | null }>(`/quizzes/${quizId}/completion`, { params: { userId } });
    return res.data?.data ?? null;
  },

  async submitQuiz(quizId: string, _userId: string, answers: Record<string, string>): Promise<QuizCompletion> {
    const res = await api.post<{ success: boolean; data: QuizCompletion }>(`/quizzes/${quizId}/submit`, { answers });
    return res.data.data;
  },

  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  },
};
