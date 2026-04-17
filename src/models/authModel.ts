import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '@/utils/supabase';

WebBrowser.maybeCompleteAuthSession();

export const signInWithPassword = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const signUp = (email: string, password: string, name: string) =>
  supabase.auth.signUp({
    email,
    password,
    options: { data: { name, avatar_url: 'default' } },
  });

export const signInWithGoogle = async () => {
  const redirectUrl = makeRedirectUri();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
  });

  if (error) throw error;

  if (data?.url) {
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    if (result.type === 'success') {
      const params = new URLSearchParams(result.url.split('#')[1]);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }
    }
  }

  return data;
};

export const getUserRole = (userId: string) =>
  supabase.from('profiles').select('role').eq('id', userId).single();

export const getUserActiveAndRole = (userId: string) =>
  supabase.from('profiles').select('role, is_active').eq('id', userId).maybeSingle();

export const getSession = () => supabase.auth.getSession();

export const onAuthStateChange = (callback: (event: import('@supabase/supabase-js').AuthChangeEvent, session: import('@supabase/supabase-js').Session | null) => void | Promise<void>) =>
  supabase.auth.onAuthStateChange(callback as Parameters<typeof supabase.auth.onAuthStateChange>[0]);

export const signOut = () => supabase.auth.signOut();
