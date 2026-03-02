/**
 * Messaging: 1:1 conversations. Uses localStorage; replace with API when backend is ready.
 */

import type { Conversation, Message } from '../types/message';

const CONVERSATIONS_KEY = 'lms_conversations';
const MESSAGES_KEY = 'lms_messages';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveConversations(list: Conversation[]) {
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(list));
}

function loadMessages(): Message[] {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMessages(list: Message[]) {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(list));
}

const ADMIN_PLACEHOLDER_ID = '__admin__';

function sortTwo<T>(a: T, b: T, key: (t: T) => string): [T, T] {
  return key(a) < key(b) ? [a, b] : [b, a];
}

export const messageService = {
  getConversationsForUser(userId: string, isAdmin?: boolean): Conversation[] {
    const list = loadConversations().filter((c) => {
      const inConv = c.participantIds[0] === userId || c.participantIds[1] === userId;
      const isAdminThread = isAdmin && (c.participantIds[0] === ADMIN_PLACEHOLDER_ID || c.participantIds[1] === ADMIN_PLACEHOLDER_ID);
      return inConv || isAdminThread;
    });
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  getOtherDisplayName(conv: Conversation, userId: string, isAdmin?: boolean): { otherUserId: string; otherUserName: string } {
    let idx: number;
    if (isAdmin && (conv.participantIds[0] === ADMIN_PLACEHOLDER_ID || conv.participantIds[1] === ADMIN_PLACEHOLDER_ID)) {
      idx = conv.participantIds[0] === ADMIN_PLACEHOLDER_ID ? 1 : 0;
    } else {
      idx = conv.participantIds[0] === userId ? 1 : 0;
    }
    return { otherUserId: conv.participantIds[idx], otherUserName: conv.participantNames[idx] };
  },

  getOrCreateConversation(
    myUserId: string,
    myUserName: string,
    otherUserId: string,
    otherUserName: string
  ): Conversation {
    const [id1, id2] = sortTwo(myUserId, otherUserId, (x) => x);
    const [name1, name2] = id1 === myUserId ? [myUserName, otherUserName] : [otherUserName, myUserName];
    const list = loadConversations();
    let conv = list.find((c) => c.participantIds[0] === id1 && c.participantIds[1] === id2);
    if (conv) return conv;
    conv = {
      id: generateId(),
      participantIds: [id1, id2],
      participantNames: [name1, name2],
      updatedAt: new Date().toISOString(),
    };
    list.push(conv);
    saveConversations(list);
    return conv;
  },

  getMessages(conversationId: string): Message[] {
    return loadMessages()
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  sendMessage(conversationId: string, senderId: string, body: string): Message {
    const msg: Message = {
      id: generateId(),
      conversationId,
      senderId,
      body: body.trim(),
      createdAt: new Date().toISOString(),
    };
    const list = loadMessages();
    list.push(msg);
    saveMessages(list);
    const convs = loadConversations();
    const conv = convs.find((c) => c.id === conversationId);
    if (conv) {
      conv.updatedAt = msg.createdAt;
      saveConversations(convs);
    }
    return msg;
  },

  generateId,
};
