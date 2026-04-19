import * as chatModel from '@/models/chatModel';
import type { Conversation } from '@/models/chatModel';

export type { Conversation };

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
};

type Result<T> = { success: true; data: T } | { success: false; error: string };

export const loadConversations = async (): Promise<Result<Conversation[]>> => {
  try {
    const { data: { user } } = await chatModel.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await chatModel.getConversations(user.id);
    if (error) return { success: false, error: 'Failed to load conversations' };

    const conversations: Conversation[] = await Promise.all(
      (data ?? []).map(async (c) => {
        const [{ data: msg }, { count }] = await Promise.all([
          chatModel.getLastMessage(c.id),
          chatModel.getUnreadCount(c.id, user.id),
        ]);
        return { ...c, last_message: msg?.content ?? '', unread_count: count ?? 0 } as Conversation;
      })
    );

      return { success: true, data: conversations };
  } catch {
    return { success: false, error: 'Something went wrong' };
  }
};

export const loadMessages = async (conversationId: string): Promise<Result<Message[]>> => {
  try {
    const { data, error } = await chatModel.getMessages(conversationId);
    if (error) return { success: false, error: 'Failed to load messages' };
    return { success: true, data: (data ?? []) as Message[] };
  } catch {
    return { success: false, error: 'Something went wrong' };
  }
};
