import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { useColorScheme } from "nativewind";
import * as SplashScreen from "expo-splash-screen";
import { supabase } from "../utils/supabase";
import { Session } from "@supabase/supabase-js";
import { consumePendingRedirect } from "../utils/redirectStore";
import { Platform } from "react-native";
import "../global.css";

let Toaster: any = null;
if (Platform.OS === 'web') {
  Toaster = require('sonner').Toaster;
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.log('Session error:', error);
        // Clear any bad session
        supabase.auth.signOut();
      }
      setSession(session);
      setLoading(false);
      SplashScreen.hideAsync();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup' || segments[0] === 'reset-password';
    const isResetPassword = segments[0] === 'reset-password';
    const isPublic = segments[0] === 'errand';
    const inAdminGroup = segments[0] === 'admin';
    const isSuspended = segments[0] === 'suspended';

    if (!session && !inAuthGroup && !isPublic && !isSuspended) {
      router.replace('/login');
    } else if (session && inAuthGroup && !isResetPassword) {
      // Check suspension before redirecting
      supabase.from('profiles').select('is_active').eq('id', session.user.id).maybeSingle().then(({ data }) => {
        if (data?.is_active === false) {
          router.replace('/suspended');
        } else {
          const dest = consumePendingRedirect();
          router.replace((dest as any) || '/');
        }
      });
    } else if (session && !inAuthGroup && !inAdminGroup && !isPublic && !isSuspended) {
      supabase.from('profiles').select('role, is_active').eq('id', session.user.id).maybeSingle().then(({ data }) => {
        if (data?.is_active === false) {
          router.replace('/suspended');
        } else if (data?.role === 'admin') {
          router.replace('/admin');
        }
      });
    }
  }, [session, segments, loading]);

  if (loading) return null;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}/>
      {Platform.OS === 'web' && Toaster && <Toaster position="top-center" richColors />}
    </>
  );
}