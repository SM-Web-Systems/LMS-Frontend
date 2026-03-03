import api from './api';
import type { Conversation, Message } from '../types/message';

export const messageService = {
  async getConversationsForUser(_userId: string, _isAdmin?: boolean): Promise<Conversation[]> {
    const res = await api.get<{ success: boolean; data: { conversations: Conversation[] } }>('/messages/conversations');
    return res.data?.data?.conversations ?? [];
  },

  getOtherDisplayName(conv: Conversation, userId: string, isAdmin?: boolean): { otherUserId: string; otherUserName: string } {
    let idx: number;
    if (isAdmin && (conv.participantIds[0] === '__admin__' || conv.participantIds[1] === '__admin__')) {
      idx = conv.participantIds[0] === '__admin__' ? 1 : 0;
    } else {
      idx = conv.participantIds[0] === userId ? 1 : 0;
    }
    return { otherUserId: conv.participantIds[idx], otherUserName: conv.participantNames[idx] };
  },

  async getOrCreateConversation(
    _myUserId: string,
    _myUserName: string,
    otherUserId: string,
    _otherUserName: string
  ): Promise<Conversation> {
    const res = await api.post<{ success: boolean; data: Conversation }>('/messages/conversations', { otherUserId });
    return res.data.data;
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const res = await api.get<{ success: boolean; data: { messages: Message[] } }>(`/messages/conversations/${conversationId}/messages`);
    return res.data?.data?.messages ?? [];
  },

  async sendMessage(conversationId: string, _senderId: string, body: string): Promise<Message> {
    const res = await api.post<{ success: boolean; data: Message }>(`/messages/conversations/${conversationId}/messages`, { body });
    return res.data.data;
  },

  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  },
};
