import { supabase } from '@/utils/supabase';
import { getDisplayProfile } from '@/models/profileModel';

export type { DisplayProfile } from '@/models/profileModel';

export type Conversation = {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at: string;
  created_at: string;
  user1_name: string;
  user1_avatar: string | null;
  user1_verified: boolean;
  user2_name: string;
  user2_avatar: string | null;
  user2_verified: boolean;
  last_message?: string;
  unread_count?: number;
};

export const getUser = () => supabase.auth.getUser();

export const getConversations = (userId: string) =>
  supabase
    .from('conversations')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('last_message_at', { ascending: false });

export { getDisplayProfile };

export const getLastMessage = (conversationId: string) =>
  supabase
    .from('messages')
    .select('content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

export const getUnreadCount = (conversationId: string, userId: string) =>
  supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .eq('is_read', false)
    .neq('sender_id', userId);

const PAGE_SIZE = 30;

export const getMessages = (conversationId: string, offset = 0) =>
  supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

export const sendMessage = (conversationId: string, senderId: string, content: string) =>
  supabase.from('messages').insert({ conversation_id: conversationId, sender_id: senderId, content }).select().single();

export const markMessagesAsRead = (conversationId: string, userId: string) =>
  supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .eq('is_read', false)
    .neq('sender_id', userId);

export const updateLastMessageAt = (conversationId: string) =>
  supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversationId);

export const subscribeToMessages = (
  onNewMessage: (payload: any) => void,
  onMessageUpdate?: (payload: any) => void,
) => {
  const channel = supabase
    .channel(`messages-${Date.now()}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, onNewMessage);
  if (onMessageUpdate) {
    channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, onMessageUpdate);
  }
  return channel.subscribe();
};

export const getOrCreateConversation = async (userAId: string, userBId: string) => {
  const [user1, user2] = [userAId, userBId].sort();

  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('user1_id', user1)
    .eq('user2_id', user2)
    .single();

  if (existing) return { data: existing, error: null };

  return supabase
    .from('conversations')
    .insert({ user1_id: user1, user2_id: user2 })
    .select('id')
    .single();
};
