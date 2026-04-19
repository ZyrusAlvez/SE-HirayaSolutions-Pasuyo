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

export const handleSendMessage = async (
  conversationId: string,
  content: string,
): Promise<Result<null>> => {
  const trimmed = content.trim();
  if (!trimmed) return { success: false, error: 'Message cannot be empty' };

  try {
    const { data: { user } } = await chatModel.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await chatModel.sendMessage(conversationId, user.id, trimmed);
    if (error) return { success: false, error: 'Failed to send message' };

    await chatModel.updateLastMessageAt(conversationId);
    return { success: true, data: null };
  } catch {
    return { success: false, error: 'Something went wrong' };
  }
};

export const startConversation = async (otherUserId: string): Promise<Result<string>> => {
  try {
    const { data: { user } } = await chatModel.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await chatModel.getOrCreateConversation(user.id, otherUserId);
    if (error || !data) return { success: false, error: 'Failed to start conversation' };

    return { success: true, data: data.id };
  } catch {
    return { success: false, error: 'Something went wrong' };
  }
};
