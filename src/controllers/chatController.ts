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

export const loadConversations = async (userId: string): Promise<Result<Conversation[]>> => {
  try {
    const { data, error } = await chatModel.getConversations(userId);
    if (error) return { success: false, error: 'Failed to load conversations' };

    const conversations: Conversation[] = await Promise.all(
      (data ?? []).map(async (c) => {
        const [{ data: msg }, { count }, p1, p2] = await Promise.all([
          chatModel.getLastMessage(c.id),
          chatModel.getUnreadCount(c.id, userId),
          chatModel.getDisplayProfile(c.user1_id),
          chatModel.getDisplayProfile(c.user2_id),
        ]);
        return {
          ...c,
          user1_name: p1.name,
          user1_avatar: p1.avatarUrl,
          user1_verified: p1.verified,
          user2_name: p2.name,
          user2_avatar: p2.avatarUrl,
          user2_verified: p2.verified,
          last_message: msg?.content ?? '',
          unread_count: count ?? 0,
        } as Conversation;
      })
    );

    return { success: true, data: conversations };
  } catch {
    return { success: false, error: 'Something went wrong' };
  }
};

export const loadMessages = async (conversationId: string, offset = 0): Promise<Result<{ messages: Message[]; hasMore: boolean }>> => {
  try {
    const { data, error } = await chatModel.getMessages(conversationId, offset);
    if (error) return { success: false, error: 'Failed to load messages' };
    const msgs = ((data ?? []) as Message[]).reverse();
    return { success: true, data: { messages: msgs, hasMore: (data ?? []).length === 30 } };
  } catch {
    return { success: false, error: 'Something went wrong' };
  }
};

export const handleSendMessage = async (
  conversationId: string,
  userId: string,
  content: string,
): Promise<Result<null>> => {
  const trimmed = content.trim();
  if (!trimmed) return { success: false, error: 'Message cannot be empty' };

  try {
    const { error } = await chatModel.sendMessage(conversationId, userId, trimmed);
    if (error) return { success: false, error: 'Failed to send message' };

    await chatModel.updateLastMessageAt(conversationId);
    return { success: true, data: null };
  } catch {
    return { success: false, error: 'Something went wrong' };
  }
};

export const startConversation = async (userId: string, otherUserId: string): Promise<Result<string>> => {
  try {
    const { data, error } = await chatModel.getOrCreateConversation(userId, otherUserId);
    if (error || !data) return { success: false, error: 'Failed to start conversation' };

    return { success: true, data: data.id };
  } catch {
    return { success: false, error: 'Something went wrong' };
  }
};
