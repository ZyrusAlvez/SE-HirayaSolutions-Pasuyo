import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { useColorScheme } from "nativewind";
import * as SplashScreen from "expo-splash-screen";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";
import { Platform } from "react-native";
import "../global.css";

let Toaster: any = null;
if (Platform.OS === 'web') {
  Toaster = require('burnt/web').Toaster;
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
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

    if (!session && !inAuthGroup) {
      router.replace('/login');
    } else if (session && inAuthGroup && !isResetPassword) {
      router.replace('/');
    }
  }, [session, segments, loading]);

  if (loading) return null;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}/>
      {Platform.OS === 'web' && Toaster && <Toaster position="top-center" />}
    </>
  );
}
