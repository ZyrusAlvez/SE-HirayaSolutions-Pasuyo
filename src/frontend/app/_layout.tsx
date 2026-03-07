import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { useColorScheme } from "nativewind";
import * as SplashScreen from "expo-splash-screen";
import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    setTimeout(() => {
      setAppReady(true);
      SplashScreen.hideAsync();
    }, 100);
  }, []);

  if (!appReady) return null;

  return <Stack screenOptions={{ headerShown: false }}/>;
}
