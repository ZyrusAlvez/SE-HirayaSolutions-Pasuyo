import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { supabase } from './supabase';

export function useSuspensionCheck() {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSuspension = async () => {
      // Skip check on login, signup, and suspended pages
      if (['/login', '/signup', '/suspended', '/reset-password'].includes(pathname)) {
        setChecking(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setChecking(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', user.id)
        .maybeSingle();

      if (profile && profile.is_active === false) {
        router.replace('/suspended');
      }
      
      setChecking(false);
    };

    checkSuspension();
  }, [pathname]);

  return checking;
}
