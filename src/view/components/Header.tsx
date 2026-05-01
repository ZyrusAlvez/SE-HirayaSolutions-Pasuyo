import { View, TouchableOpacity, Image, Platform, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VerificationBadge from './VerificationBadge';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import NotificationsPanel from './NotificationsPanel';

const DEFAULT_AVATAR = require('../../assets/images/default_profile.jpg');

import type { VerificationStatus } from './VerificationBadge';

interface Props {
  avatarUrl?: any;
  verificationStatus?: VerificationStatus;
}

export default function Header({ avatarUrl, verificationStatus }: Props) {
  const router = useRouter();
  const isWeb = Platform.OS === 'web';
  const { unreadCount, setUnreadCount } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const [imgSrc, setImgSrc] = useState(avatarUrl ?? DEFAULT_AVATAR);

  useEffect(() => {
    setImgSrc(avatarUrl ?? DEFAULT_AVATAR);
  }, [avatarUrl]);

  return (
    <View className={`bg-white border-b border-gray-100 ${!isWeb ? 'pt-12' : 'pt-2'}`}>
      <View style={[styles.inner, isWeb && { paddingBottom: 8 }]}>
        <TouchableOpacity onPress={() => router.push('/')} activeOpacity={0.7}>
          <Image
            source={require('../../assets/logo/Pasuyo_full.png')}
            style={{ width: isWeb ? 100 : 120, height: isWeb ? 32 : 40 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
          <NotificationsPanel visible={showNotifications} onClose={() => setShowNotifications(false)} onUnreadChange={setUnreadCount} />
          <TouchableOpacity testID="notifications-bell" onPress={() => setShowNotifications(v => !v)} activeOpacity={0.7} style={{ marginRight: 8 }}>
            <View>
              <Ionicons name="notifications-outline" size={22} color="#6B7280" />
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
                source={imgSrc}
                onError={() => setImgSrc(DEFAULT_AVATAR)}
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
