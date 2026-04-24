import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { getUnreadCount, subscribeToMessages } from '@/models/chatModel';

interface UnreadContextType {
  unreadCount: number;
}

const UnreadContext = createContext<UnreadContextType>({ unreadCount: 0 });

export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      if (!session) setUnreadCount(0);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const refresh = () => getUnreadCount(userId).then(setUnreadCount);
    refresh();

    const channel = subscribeToMessages(
      () => refresh(),
      () => refresh(),
    );

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return (
    <UnreadContext.Provider value={{ unreadCount }}>
      {children}
    </UnreadContext.Provider>
  );
}

export const useUnread = () => useContext(UnreadContext);
