import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import Input, { TextArea } from '../components/Input';
import { forumService } from '../services/forumService';
import type { ForumTopic, ForumPost } from '../types/forum';
import {
  MessageCircle,
  Plus,
  ArrowLeft,
  Send,
  Loader2,
  User,
  Calendar,
  MessageSquare,
} from 'lucide-react';

const Forum: React.FC = () => {
  const { user } = useAuth();
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);

  const loadTopics = useCallback(async () => {
    try {
      const list = await forumService.getTopics();
      setTopics(Array.isArray(list) ? list : []);
    } catch {
      setTopics([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadTopics().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [loadTopics]);

  useEffect(() => {
    if (!selectedTopic) return;
    setReplyBody('');
    let cancelled = false;
    setPostsLoading(true);
    setPosts([]);
    forumService
      .getPosts(selectedTopic.id)
      .then((list) => {
        if (!cancelled) {
          setPosts(Array.isArray(list) ? list : []);
        }
      })
      .catch(() => {
        if (!cancelled) setPosts([]);
      })
      .finally(() => {
        if (!cancelled) setPostsLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedTopic]);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle.trim() || !newBody.trim()) return;
    setSubmitting(true);
    try {
      await forumService.createTopic(user, { title: newTitle.trim(), body: newBody.trim() });
      setNewTitle('');
      setNewBody('');
      setShowNewTopic(false);
      await loadTopics();
    } catch {
      // Error handled by service / could show toast
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTopic || !replyBody.trim()) return;
    setSubmitting(true);
    try {
      await forumService.createPost(user, selectedTopic.id, { body: replyBody.trim() });
      setReplyBody('');
      const [updatedPosts, updatedTopic] = await Promise.all([
        forumService.getPosts(selectedTopic.id),
        forumService.getTopic(selectedTopic.id),
      ]);
      setPosts(Array.isArray(updatedPosts) ? updatedPosts : []);
      setSelectedTopic(updatedTopic ?? selectedTopic);
      await loadTopics(); // refresh topic list (post count, lastPostAt)
    } catch {
      // Error handled by service / could show toast
    } finally {
      setSubmitting(false);
    }
  };

  const openTopic = (topic: ForumTopic) => {
    setSelectedTopic(topic);
    // Posts are loaded by the useEffect when selectedTopic changes
  };

  const backToList = () => {
    setSelectedTopic(null);
    setPosts([]);
  };

  // Thread view: single topic + replies
  if (selectedTopic) {
    const author = selectedTopic.author ?? { name: 'Unknown', role: 'student' };
    return (
      <div>
        <div className="mb-6">
          <Button variant="outline" onClick={backToList} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to discussions
          </Button>
          <Card>
            <CardContent className="p-6">
              <h1 className="text-2xl font-bold text-neutral-800 mb-2">{selectedTopic.title}</h1>
              <PostAuthor author={author} createdAt={selectedTopic.createdAt} />
              <div className="mt-4 text-neutral-700 whitespace-pre-wrap">{selectedTopic.body}</div>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-lg font-semibold text-neutral-800 mb-3">
          Replies ({posts.length})
        </h2>
        {postsLoading ? (
          <div className="flex items-center justify-center py-12 mb-8">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        ) : (
        <div className="space-y-4 mb-8">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-4">
                <PostAuthor author={post.author ?? { name: 'Unknown', role: 'student' }} createdAt={post.createdAt} />
                <div className="mt-3 text-neutral-700 whitespace-pre-wrap">{post.body}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-neutral-800 mb-3">Add a reply</h3>
            <form onSubmit={handleReply} className="space-y-3">
              <TextArea
                placeholder="Write your reply..."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                rows={4}
                required
              />
              <Button type="submit" disabled={submitting || !replyBody.trim()}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Reply
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // List view: topics + new topic
  return (
    <div>
      <div className="mb-6 flex items-center">
        <MessageCircle className="h-8 w-8 text-primary-600 mr-3 shrink-0" />
        <div>
          <h1 className="text-3xl font-bold text-neutral-800">Class discussions</h1>
          <p className="text-neutral-600 mt-1">
            Ask questions and discuss with the class. Open to everyone.
          </p>
        </div>
      </div>

      {/* Prominent "Start discussion" button - always visible */}
      <Card className="mb-6 border-2 border-accent-teal/40 bg-accent-teal/5">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-semibold text-neutral-800">Start a discussion</h2>
              <p className="text-sm text-neutral-600 mt-0.5">Post a question or topic for the class.</p>
            </div>
            <Button
              onClick={() => setShowNewTopic(true)}
              className="w-full sm:w-auto shrink-0"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              New discussion
            </Button>
          </div>
        </CardContent>
      </Card>

      {showNewTopic && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-neutral-800 mb-4">New discussion</h2>
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <Input
                type="text"
                label="Title"
                placeholder="Give your discussion a title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
              <TextArea
                label="What would you like to discuss?"
                placeholder="Write your question or topic here..."
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                rows={4}
                required
              />
              <p className="text-sm text-neutral-500">Click the button below to publish your discussion.</p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting || !newTitle.trim() || !newBody.trim()}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Post discussion
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => { setShowNewTopic(false); setNewTitle(''); setNewBody(''); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      ) : topics.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-800 mb-2">No discussions yet</h3>
            <p className="text-neutral-600 mb-4">Start the first topic to get the conversation going.</p>
            <Button onClick={() => setShowNewTopic(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New topic
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {topics.map((topic) => (
            <Card
              key={topic.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openTopic(topic)}
            >
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-neutral-800 truncate">{topic.title}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3" />
                      {topic.author?.name ?? 'Unknown'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3" />
                      {topic.postCount} {topic.postCount === 1 ? 'reply' : 'replies'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3" />
                      {formatDate(topic.lastPostAt || topic.createdAt)}
                    </span>
                  </div>
                </div>
                <span className="text-accent-teal text-sm font-medium shrink-0">View →</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

function PostAuthor({
  author,
  createdAt,
}: {
  author: { name?: string; role?: string };
  createdAt: string;
}) {
  const name = author?.name ?? 'Unknown';
  const role = author?.role ?? '';
  return (
    <div className="flex items-center gap-2 text-sm text-neutral-500">
      <span className="font-medium text-neutral-700">{name}</span>
      {role && <><span>·</span><span className="capitalize">{role}</span></>}
      <span>·</span>
      <time dateTime={createdAt}>{formatDate(createdAt)}</time>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export default Forum;
