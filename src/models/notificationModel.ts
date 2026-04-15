import { supabase, supabaseAdmin } from '../utils/supabase';

export interface NotificationRow {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  action: string | null;
}

export const postNotification = (userId: string, title: string, message: string, action?: string) => {
  if (!supabaseAdmin) throw new Error('Admin client not available');
  return supabaseAdmin.from('notifications').insert({ user_id: userId, title, message, action });
};

export const getNotifications = async (userId: string) =>
  supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

export const getUnreadCount = async (userId: string) =>
  supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

export const updateNotificationRead = (id: string) =>
  supabase.from('notifications').update({ is_read: true }).eq('id', id);

export const updateAllNotificationsRead = (userId: string) =>
  supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);

export const getNotificationsSubscription = (channelName: string, callback: () => void) =>
  supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, callback)
    .subscribe();

export const removeNotificationsSubscription = (channel: ReturnType<typeof getNotificationsSubscription>) =>
  supabase.removeChannel(channel);
