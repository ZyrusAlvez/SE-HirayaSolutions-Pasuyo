import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { joinPresence, leavePresence, sendGoodbye } from '@/models/presenceModel';

interface PresenceContextType {
  onlineUsers: Set<string>;
}

const PresenceContext = createContext<PresenceContextType>({ onlineUsers: new Set() });

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const joinedRef = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user && !joinedRef.current) {
        joinedRef.current = true;
        joinPresence(session.user.id, (ids) => {
          setOnlineUsers(new Set(ids));
        });
      } else if (event === 'SIGNED_OUT') {
        joinedRef.current = false;
        leavePresence();
        setOnlineUsers(new Set());
      }
    });

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !joinedRef.current) {
        joinedRef.current = true;
        joinPresence(session.user.id, (ids) => {
          setOnlineUsers(new Set(ids));
        });
      }
    });

    // Handle tab close — send goodbye instantly
    const handleUnload = () => {
      sendGoodbye();
    };
    window.addEventListener?.('beforeunload', handleUnload);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener?.('beforeunload', handleUnload);
    };
  }, []);

  return (
    <PresenceContext.Provider value={{ onlineUsers }}>
      {children}
    </PresenceContext.Provider>
  );
}

export const usePresence = () => useContext(PresenceContext);
