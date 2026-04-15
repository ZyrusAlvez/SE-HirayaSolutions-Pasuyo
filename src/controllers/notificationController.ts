import * as notificationModel from '../models/notificationModel';
import type { NotificationRow } from '../models/notificationModel';
import { supabase } from '../utils/supabase';

export interface Notification extends NotificationRow {}

type Result<T = void> = { success: true; data: T } | { success: false; error: string };

export const postNotification = async (userId: string, title: string, message: string, action?: string): Promise<Result> => {
  try {
    const { error } = await notificationModel.postNotification(userId, title, message, action);
    if (error) return { success: false, error: error.message };
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: 'Failed to send notification' };
  }
};

export const getNotifications = async (): Promise<Result<Notification[]>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await notificationModel.getNotifications(user.id);
    if (error) return { success: false, error: error.message };
    return { success: true, data: (data ?? []) as Notification[] };
  } catch {
    return { success: false, error: 'Failed to fetch notifications' };
  }
};

export const getUnreadCount = async (): Promise<number> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;
    const { count } = await notificationModel.getUnreadCount(user.id);
    return count || 0;
  } catch {
    return 0;
  }
};


export const updateNotificationRead = async (id: string): Promise<Result> => {
  try {
    const { error } = await notificationModel.updateNotificationRead(id);
    if (error) return { success: false, error: error.message };
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: 'Failed to mark notification as read' };
  }
};

export const updateAllNotificationsRead = async (): Promise<Result> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await notificationModel.updateAllNotificationsRead(user.id);
    if (error) return { success: false, error: error.message };
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: 'Failed to mark all notifications as read' };
  }
};

export const getNotificationsSubscription = (channelName: string, callback: () => void) =>
  notificationModel.getNotificationsSubscription(channelName, callback);

export const removeNotificationsSubscription = (channel: ReturnType<typeof notificationModel.getNotificationsSubscription>) =>
  notificationModel.removeNotificationsSubscription(channel);
