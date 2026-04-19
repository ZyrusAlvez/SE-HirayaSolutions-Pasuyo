import * as chatModel from '@/models/chatModel';
import type { Conversation } from '@/models/chatModel';

export type { Conversation };

type Result<T> = { success: true; data: T } | { success: false; error: string };

export const loadConversations = async (): Promise<Result<Conversation[]>> => {
  try {
    const { data: { user } } = await chatModel.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await chatModel.getConversations(user.id);
    if (error) return { success: false, error: 'Failed to load conversations' };

    const conversations: Conversation[] = await Promise.all(
      (data ?? []).map(async (c) => {
        const { data: msg } = await chatModel.getLastMessage(c.id);
        return { ...c, last_message: msg?.content ?? '' } as Conversation;
      })
    );

    return { success: true, data: conversations };
  } catch {
    return { success: false, error: 'Something went wrong' };
  }
};
