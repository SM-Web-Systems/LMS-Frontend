/**
 * Forum service: questions and class discussions.
 * Uses localStorage so it works without a backend. Replace with API calls when backend is ready.
 */

import type { User } from '../types/api';
import type { ForumTopic, ForumPost, ForumAuthor, CreateTopicData, CreatePostData } from '../types/forum';

const STORAGE_TOPICS = 'lms_forum_topics';
const STORAGE_POSTS = 'lms_forum_posts';

function authorFromUser(user: User): ForumAuthor {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function loadTopics(): ForumTopic[] {
  try {
    const raw = localStorage.getItem(STORAGE_TOPICS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadPosts(): ForumPost[] {
  try {
    const raw = localStorage.getItem(STORAGE_POSTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTopics(topics: ForumTopic[]) {
  localStorage.setItem(STORAGE_TOPICS, JSON.stringify(topics));
}

function savePosts(posts: ForumPost[]) {
  localStorage.setItem(STORAGE_POSTS, JSON.stringify(posts));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export const forumService = {
  getTopics(): ForumTopic[] {
    const topics = loadTopics();
    const posts = loadPosts();
    // Attach postCount and lastPostAt
    return topics.map((t) => {
      const topicPosts = posts.filter((p) => p.topicId === t.id);
      const lastPost = topicPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      return {
        ...t,
        postCount: topicPosts.length,
        lastPostAt: lastPost?.createdAt,
      };
    }).sort((a, b) => new Date(b.lastPostAt || b.createdAt).getTime() - new Date(a.lastPostAt || a.createdAt).getTime());
  },

  getTopic(id: string): ForumTopic | null {
    const topics = loadTopics();
    const topic = topics.find((t) => t.id === id) ?? null;
    if (!topic) return null;
    const posts = loadPosts();
    const topicPosts = posts.filter((p) => p.topicId === id);
    const lastPost = topicPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    return {
      ...topic,
      postCount: topicPosts.length,
      lastPostAt: lastPost?.createdAt,
    };
  },

  getPosts(topicId: string): ForumPost[] {
    const posts = loadPosts().filter((p) => p.topicId === topicId);
    return posts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  createTopic(user: User, data: CreateTopicData): ForumTopic {
    const topics = loadTopics();
    const author = authorFromUser(user);
    const now = new Date().toISOString();
    const topic: ForumTopic = {
      id: generateId(),
      title: data.title,
      body: data.body,
      author,
      createdAt: now,
      updatedAt: now,
      postCount: 0,
    };
    topics.unshift(topic);
    saveTopics(topics);
    return { ...topic, postCount: 0 };
  },

  createPost(user: User, topicId: string, data: CreatePostData): ForumPost {
    const posts = loadPosts();
    const topics = loadTopics();
    const author = authorFromUser(user);
    const now = new Date().toISOString();
    const post: ForumPost = {
      id: generateId(),
      topicId,
      body: data.body,
      author,
      createdAt: now,
      updatedAt: now,
    };
    posts.push(post);
    savePosts(posts);
    const topic = topics.find((t) => t.id === topicId);
    if (topic) {
      topic.updatedAt = now;
      saveTopics(topics);
    }
    return post;
  },
};
