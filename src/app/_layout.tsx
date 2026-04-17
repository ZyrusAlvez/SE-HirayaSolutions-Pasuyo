import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { preventAutoHideAsync, hideAsync } from "expo-splash-screen";
import { Session } from "@supabase/supabase-js";
import { Platform } from "react-native";
import { getSession, onAuthStateChange, getUserActiveAndRole, logout } from "../controllers/authController";
import "../global.css";

let Toaster: any = null;
if (Platform.OS === 'web') {
  Toaster = require('sonner').Toaster;
}

preventAutoHideAsync();

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.log('Session error:', error);
        logout();
      }
      setSession(session);
      setLoading(false);
      hideAsync();
    });

    const { data: { subscription } } = onAuthStateChange((_event, session) => {
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
      getUserActiveAndRole(session.user.id).then(({ data }) => {
        if (data?.is_active === false) {
          router.replace('/suspended');
        } else {
          router.replace('/');
        }
      });
    } else if (session && !inAuthGroup && !inAdminGroup && !isPublic && !isSuspended) {
      getUserActiveAndRole(session.user.id).then(({ data }) => {
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