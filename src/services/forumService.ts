import api from './api';
import type { User } from '../types/api';
import type { ForumTopic, ForumPost, CreateTopicData, CreatePostData } from '../types/forum';

export const forumService = {
  async getTopics(): Promise<ForumTopic[]> {
    const res = await api.get<{ success: boolean; data: { topics: ForumTopic[] } }>('/forum/topics');
    return res.data?.data?.topics ?? [];
  },

  async getTopic(id: string): Promise<ForumTopic | null> {
    try {
      const res = await api.get<{ success: boolean; data: ForumTopic }>(`/forum/topics/${id}`);
      return res.data?.data ?? null;
    } catch {
      return null;
    }
  },

  async getPosts(topicId: string): Promise<ForumPost[]> {
    const res = await api.get<{ success: boolean; data: { posts: ForumPost[] } }>(`/forum/topics/${topicId}/posts`);
    return res.data?.data?.posts ?? [];
  },

  async createTopic(_user: User, data: CreateTopicData): Promise<ForumTopic> {
    const res = await api.post<{ success: boolean; data: ForumTopic }>('/forum/topics', data);
    return res.data.data;
  },

  async createPost(_user: User, topicId: string, data: CreatePostData): Promise<ForumPost> {
    const res = await api.post<{ success: boolean; data: ForumPost }>(`/forum/topics/${topicId}/posts`, data);
    return res.data.data;
  },

  async deleteTopic(id: string): Promise<void> {
    await api.delete(`/forum/topics/${id}`);
  },
};
