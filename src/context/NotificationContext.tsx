import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getUnreadCount, getNotificationsSubscription, removeNotificationsSubscription } from '@/controllers/notificationController';
import { onAuthStateChange } from '@/controllers/authController';

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
  const channelRef = useRef<any>(null);

  const setup = async () => {
    setUnreadCount(await getUnreadCount());
    if (channelRef.current) removeNotificationsSubscription(channelRef.current);
    channelRef.current = getNotificationsSubscription(
      `notification-context-${Date.now()}`,
      async () => setUnreadCount(await getUnreadCount()),
    );
  };

  const teardown = () => {
    if (channelRef.current) {
      removeNotificationsSubscription(channelRef.current);
      channelRef.current = null;
    }
    setUnreadCount(0);
  };

  useEffect(() => {
    setup();

    const { data: { subscription } } = onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') setup();
      if (event === 'SIGNED_OUT') teardown();
    });

    return () => {
      teardown();
      subscription.unsubscribe();
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ unreadCount, setUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);
