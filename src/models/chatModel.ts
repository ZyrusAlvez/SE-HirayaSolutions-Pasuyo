import { supabase } from '@/utils/supabase';
import { getDisplayProfile } from '@/models/profileModel';
import { Platform } from 'react-native';

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
  last_message_sender_id?: string;
  last_message_is_read?: boolean;
};

export const getUser = () => supabase.auth.getUser();

export const getConversations = (userId: string) =>
  supabase
    .from('conversations_with_profiles')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('last_message_at', { ascending: false });

export { getDisplayProfile };

const PAGE_SIZE = 30;

export const getMessages = (conversationId: string, offset = 0) =>
  supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

export const sendMessage = (conversationId: string, senderId: string, content: string, file?: { file_url: string; file_name: string; file_type: string }) =>
  supabase.from('messages').insert({ conversation_id: conversationId, sender_id: senderId, content, ...file }).select().single();

export const uploadChatFile = async (conversationId: string, uri: string, fileName: string, mimeType: string) => {
  const path = `${conversationId}/${Date.now()}_${fileName}`;

  let body: any;
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    body = await res.blob();
  } else {
    body = { uri, type: mimeType, name: fileName };
  }

  const { error } = await supabase.storage.from('chat-files').upload(path, body, { contentType: mimeType, upsert: false });
  if (error) return { data: null, error };

  const { data: urlData } = supabase.storage.from('chat-files').getPublicUrl(path);
  return { data: { url: urlData.publicUrl, name: fileName, type: mimeType }, error: null };
};

export const markMessagesAsRead = async (conversationId: string, userId: string) => {
  const [msgResult, convoResult] = await Promise.all([
    supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('is_read', false)
      .neq('sender_id', userId),
    supabase
      .from('conversations')
      .update({ last_message_is_read: true })
      .eq('id', conversationId),
  ]);
  return msgResult;
};

export const sendSystemMessage = (conversationId: string, content: string) =>
  supabase.from('messages').insert({ conversation_id: conversationId, sender_id: null, content, is_read: true }).select().single();

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

export const subscribeToTyping = (
  conversationId: string,
  onTyping: (userId: string) => void,
) => {
  const channel = supabase.channel(`typing-${conversationId}`);
  channel
    .on('broadcast', { event: 'typing' }, (payload) => {
      onTyping(payload.payload.userId);
    })
    .subscribe();
  return channel;
};

export const broadcastTyping = (conversationId: string, userId: string) => {
  const channel = supabase.channel(`typing-${conversationId}`);
  channel.send({ type: 'broadcast', event: 'typing', payload: { userId } });
};
