import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { joinPresence, leavePresence } from '@/models/presenceModel';

interface PresenceContextType {
  onlineUsers: Set<string>;
}

const PresenceContext = createContext<PresenceContextType>({ onlineUsers: new Set() });

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || !mounted) return;

      joinPresence(session.user.id, (ids) => {
        if (mounted) setOnlineUsers(new Set(ids));
      });
    })();

    return () => {
      mounted = false;
      leavePresence();
    };
  }, []);

  return (
    <PresenceContext.Provider value={{ onlineUsers }}>
      {children}
    </PresenceContext.Provider>
  );
}

export const usePresence = () => useContext(PresenceContext);
