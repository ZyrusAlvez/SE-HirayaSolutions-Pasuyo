import * as notificationModel from '../models/notificationModel';

type Result = { success: boolean; error: string };

export const sendNotification = async (userId: string, title: string, message: string): Promise<Result> => {
  try {
    const { error } = await notificationModel.insertNotification(userId, title, message);
    if (error) return { success: false, error: error.message };
    return { success: true, error: '' };
  } catch {
    return { success: false, error: 'Failed to send notification' };
  }
};
