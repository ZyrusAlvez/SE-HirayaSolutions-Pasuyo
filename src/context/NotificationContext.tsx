import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getUnreadCount, getNotificationsSubscription, removeNotificationsSubscription } from '@/controllers/notificationController';

interface NotificationContextType {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  setUnreadCount: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef(`notification-context-${Date.now()}`);

  useEffect(() => {
    const fetchUnread = async () => setUnreadCount(await getUnreadCount());
    fetchUnread();
    const channel = getNotificationsSubscription(channelRef.current, fetchUnread);
    return () => { removeNotificationsSubscription(channel); };
  }, []);

  return (
    <NotificationContext.Provider value={{ unreadCount, setUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);
