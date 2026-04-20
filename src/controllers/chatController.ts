import * as chatModel from '@/models/chatModel';
import type { Conversation } from '@/models/chatModel';

export type { Conversation };

export type MessageStatus = 'sending' | 'sent' | 'seen';

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  _status?: MessageStatus;
};

type Result<T> = { success: true; data: T } | { success: false; error: string };

export const loadConversations = async (userId: string): Promise<Result<Conversation[]>> => {
  try {
    const { data, error } = await chatModel.getConversations(userId);
    if (error) return { success: false, error: 'Failed to load conversations' };

    const conversations: Conversation[] = (data ?? []).map((c) => ({
      ...c,
      last_message: c.last_message ?? '',
      last_message_sender_id: c.last_message_sender_id ?? undefined,
      last_message_is_read: c.last_message_is_read ?? true,
    }));

    return { success: true, data: conversations };
  } catch {
    return { success: false, error: 'Something went wrong' };
  }
};

export const loadMessages = async (conversationId: string, offset = 0, currentUserId?: string): Promise<Result<{ messages: Message[]; hasMore: boolean }>> => {
  try {
    const { data, error } = await chatModel.getMessages(conversationId, offset);
    if (error) return { success: false, error: 'Failed to load messages' };
    const msgs = ((data ?? []) as Message[]).reverse().map((m) => ({
      ...m,
      _status: m.sender_id === currentUserId
        ? (m.is_read ? 'seen' as const : 'sent' as const)
        : undefined,
    }));
    return { success: true, data: { messages: msgs, hasMore: (data ?? []).length === 30 } };
  } catch {
    return { success: false, error: 'Something went wrong' };
  }
};

export const handleSendMessage = async (
  conversationId: string,
  userId: string,
  content: string,
): Promise<Result<Message>> => {
  const trimmed = content.trim();
  if (!trimmed) return { success: false, error: 'Message cannot be empty' };

  try {
    const { data, error } = await chatModel.sendMessage(conversationId, userId, trimmed);
    if (error || !data) return { success: false, error: 'Failed to send message' };

    await chatModel.updateLastMessageAt(conversationId, trimmed, userId);
    return { success: true, data: { ...data, _status: 'sent' } as Message };
  } catch {
    return { success: false, error: 'Something went wrong' };
  }
};

export const handleSendFile = async (
  conversationId: string,
  userId: string,
  uri: string,
  fileName: string,
  mimeType: string,
): Promise<Result<Message>> => {
  try {
    const upload = await chatModel.uploadChatFile(conversationId, uri, fileName, mimeType);
    if (upload.error || !upload.data) return { success: false, error: 'Failed to upload file' };

    const displayName = fileName;
    const content = mimeType.startsWith('image/') ? '📷 Photo' : `📎 ${displayName}`;
    const { data, error } = await chatModel.sendMessage(conversationId, userId, content, {
      file_url: upload.data.url,
      file_name: upload.data.name,
      file_type: upload.data.type,
    });
    if (error || !data) return { success: false, error: 'Failed to send file message' };

    await chatModel.updateLastMessageAt(conversationId, content, userId);
    return { success: true, data: { ...data, _status: 'sent' } as Message };
  } catch {
    return { success: false, error: 'Something went wrong' };
  }
};

export const markAsRead = async (conversationId: string, userId: string): Promise<Result<null>> => {
  try {
    const { error } = await chatModel.markMessagesAsRead(conversationId, userId);
    if (error) return { success: false, error: 'Failed to mark as read' };
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
