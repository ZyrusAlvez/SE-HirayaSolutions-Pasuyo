import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '../../utils/supabase';
import AdminHeader from '../../view/presentation/admin/AdminHeader';

export default function AdminLayout() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') { router.replace('/'); return; }

      setChecking(false);
    });
  }, []);

  if (checking) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <AdminHeader />
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
