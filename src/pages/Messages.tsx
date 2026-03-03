import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { messageService } from '../services/messageService';
import { enrollmentService } from '../services/enrollmentService';
import { studentsService } from '../services/studentsService';
import { userDirectoryService } from '../services/userDirectoryService';
import type { Conversation, Message } from '../types/message';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { TextArea } from '../components/Input';
import { MessageCircle, Send, Plus, ArrowLeft, User } from 'lucide-react';

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const userName = user?.name ?? 'Me';
  const isAdmin = user?.role === 'admin';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageBody, setNewMessageBody] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openingConversation, setOpeningConversation] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [peers, setPeers] = useState<{ id: string; name: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [convs, peerList] = await Promise.all([
          messageService.getConversationsForUser(userId, isAdmin),
          enrollmentService.getPeersInMyCourses(userId, isAdmin),
        ]);
        if (!cancelled) {
          setConversations(convs);
          setPeers(peerList);
        }
      } catch {
        if (!cancelled) {
          setConversations([]);
          setPeers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, isAdmin]);

  useEffect(() => {
    if (!isAdmin || !userId) return;
    (async () => {
      try {
        const r = await studentsService.getAll({ limit: 500 });
        userDirectoryService.addMany(
          r.students.map((s) => ({
            id: s.userId || s.id,
            name: s.name,
            email: s.email,
            role: 'student' as const,
          }))
        );
        const peerList = await enrollmentService.getPeersInMyCourses(userId, true);
        setPeers(peerList);
      } catch {
        // ignore
      }
    })();
  }, [isAdmin, userId]);

  const openConversationFromState = async (otherUserId: string, otherUserName: string) => {
    if (!userId) return;
    setOpeningConversation(true);
    try {
      const conv = await messageService.getOrCreateConversation(userId, userName, otherUserId, otherUserName);
      const [convs, msgs] = await Promise.all([
        messageService.getConversationsForUser(userId, isAdmin),
        messageService.getMessages(conv.id),
      ]);
      setConversations(convs);
      setSelectedConversation(conv);
      setMessages(msgs);
      setShowNewConversation(false);
    } finally {
      setOpeningConversation(false);
    }
  };

  useEffect(() => {
    const state = location.state as { openUserId?: string; openUserName?: string } | null;
    if (state?.openUserId && state?.openUserName && userId) {
      openConversationFromState(state.openUserId, state.openUserName);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, userId, isAdmin, userName]);

  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const msgs = await messageService.getMessages(selectedConversation.id);
        if (!cancelled) setMessages(msgs);
      } catch {
        if (!cancelled) setMessages([]);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const refreshConversations = async () => {
    if (!userId) return;
    try {
      const convs = await messageService.getConversationsForUser(userId, isAdmin);
      setConversations(convs);
    } catch {
      // ignore
    }
  };

  const openConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setShowNewConversation(false);
  };

  const startConversationWith = (otherUserId: string, otherUserName: string) => {
    openConversationFromState(otherUserId, otherUserName);
  };

  const handleSend = async () => {
    const body = newMessageBody.trim();
    if (!body || !selectedConversation || !userId) return;
    setSending(true);
    try {
      await messageService.sendMessage(selectedConversation.id, userId, body);
      const msgs = await messageService.getMessages(selectedConversation.id);
      setMessages(msgs);
      setNewMessageBody('');
      await refreshConversations();
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    return sameDay ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString();
  };

  const otherUserId = selectedConversation ? messageService.getOtherDisplayName(selectedConversation, userId, isAdmin).otherUserId : null;
  const otherUserName = selectedConversation ? messageService.getOtherDisplayName(selectedConversation, userId, isAdmin).otherUserName : '';

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-neutral-600">You must be signed in to view messages.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-8 w-8 text-primary-600" />
          <div>
            <h1 className="text-3xl font-bold text-neutral-800">Messages</h1>
            <p className="text-neutral-600 mt-0.5">Message anyone in your course(s).</p>
          </div>
        </div>
        {!showNewConversation && !selectedConversation && (
          <Button onClick={() => setShowNewConversation(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New conversation
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-0">
            {showNewConversation ? (
              <div className="p-4 border-b border-neutral-200">
                <Button variant="outline" size="sm" onClick={() => setShowNewConversation(false)} className="mb-3">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <p className="text-sm font-medium text-neutral-700 mb-2">People in your course(s)</p>
                {loading ? (
                  <p className="text-sm text-neutral-500">Loading...</p>
                ) : peers.length === 0 ? (
                  <p className="text-sm text-neutral-500">
                    No one else in your courses yet. Ask your admin to add you to a course, or to add others so you can message them.
                  </p>
                ) : (
                  peers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => startConversationWith(p.id, p.name)}
                      disabled={openingConversation}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-50 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <User className="h-4 w-4 text-neutral-400 shrink-0" />
                      <span className="text-neutral-800 truncate">{p.name}</span>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <>
                <div className="p-3 border-b border-neutral-200 flex justify-between items-center">
                  <span className="font-medium text-neutral-800">Conversations</span>
                  <Button variant="outline" size="sm" onClick={() => setShowNewConversation(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {loading ? (
                    <p className="p-4 text-sm text-neutral-500">Loading...</p>
                  ) : conversations.length === 0 ? (
                    <p className="p-4 text-sm text-neutral-500">No conversations yet. Start one above.</p>
                  ) : (
                    conversations.map((conv) => {
                      const { otherUserName: name } = messageService.getOtherDisplayName(conv, userId, isAdmin);
                      return (
                        <button
                          key={conv.id}
                          onClick={() => openConversation(conv)}
                          className={`w-full flex items-center gap-3 p-4 text-left border-b border-neutral-100 last:border-0 hover:bg-neutral-50 ${
                            selectedConversation?.id === conv.id ? 'bg-primary-dark/5' : ''
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center shrink-0">
                            <User className="h-5 w-5 text-neutral-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-neutral-800 truncate">{name}</p>
                            <p className="text-xs text-neutral-500">{formatTime(conv.updatedAt)}</p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {selectedConversation ? (
            <Card className="flex flex-col h-[500px]">
              <CardContent className="p-0 flex flex-col flex-1 min-h-0">
                <div className="p-4 border-b border-neutral-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Button variant="outline" size="sm" onClick={() => setSelectedConversation(null)} className="lg:hidden shrink-0">
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-semibold text-neutral-800 truncate">{otherUserName}</span>
                  </div>
                  {otherUserId && otherUserId !== '__admin__' && (
                    <Button variant="outline" size="sm" onClick={() => navigate(user?.role === 'admin' ? `/admin/profile/${otherUserId}` : `/student/profile/${otherUserId}`)}>
                      View profile
                    </Button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.senderId === userId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          m.senderId === userId ? 'bg-accent-teal text-white' : 'bg-neutral-100 text-neutral-800'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                        <p className={`text-xs mt-1 ${m.senderId === userId ? 'text-white/80' : 'text-neutral-500'}`}>
                          {formatTime(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-neutral-200">
                  <div className="flex gap-2">
                    <TextArea
                      placeholder="Type a message..."
                      value={newMessageBody}
                      onChange={(e) => setNewMessageBody(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                      }}
                      rows={2}
                      className="flex-1 resize-none"
                    />
                    <Button onClick={handleSend} disabled={sending || !newMessageBody.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[500px] flex items-center justify-center">
              <CardContent className="text-center text-neutral-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
                <p>{openingConversation ? 'Opening conversation...' : 'Select a conversation or start a new one.'}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
