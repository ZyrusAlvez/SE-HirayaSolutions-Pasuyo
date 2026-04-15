import { View, TouchableOpacity, Image, Platform, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VerificationBadge from './VerificationBadge';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../utils/supabase';

const DEFAULT_AVATAR = require('../../assets/images/default_profile.jpg');

import type { VerificationStatus } from './VerificationBadge';

interface Props {
  avatarUrl?: any;
  verificationStatus?: VerificationStatus;
}

export default function Header({ avatarUrl, verificationStatus }: Props) {
  const router = useRouter();
  const isWeb = Platform.OS === 'web';
  const [unreadCount, setUnreadCount] = useState(0);

  const channelRef = useRef(`header-notifications-${Date.now()}`);

  useEffect(() => {
    const fetchUnread = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      setUnreadCount(count || 0);
    };
    fetchUnread();
    const channel = supabase
      .channel(channelRef.current)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchUnread)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <View className={`bg-white border-b border-gray-100 ${!isWeb ? 'pt-12' : 'pt-2'}`}>
      <View style={[styles.inner, isWeb && { paddingBottom: 8 }]}>
        <TouchableOpacity className="p-2" activeOpacity={0.7}>
          <Ionicons name="menu" size={28} color="#000" />
        </TouchableOpacity>
        <Image
          source={require('../../assets/logo/Pasuyo_full.png')}
          style={{ width: isWeb ? 100 : 120, height: isWeb ? 32 : 40 }}
          resizeMode="contain"
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.push('/notifications')} activeOpacity={0.7}>
            <View>
              <Ionicons name="notifications-outline" size={26} color="#374151" />
              {unreadCount > 0 && (
                <View style={{ position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/profile')} activeOpacity={0.7}>
            <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#FACC15', alignItems: 'center', justifyContent: 'center' }}>
              <Image
                source={avatarUrl ?? DEFAULT_AVATAR}
                style={{ width: 34, height: 34, borderRadius: 17 }}
                resizeMode="cover"
              />
              <VerificationBadge status={verificationStatus ?? 'not_verified'} variant="icon" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 12,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
});
