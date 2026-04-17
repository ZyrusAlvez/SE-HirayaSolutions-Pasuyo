import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { getProfile } from '@/controllers/profileController';
import Header from '@/view/components/Header';
import NavBar from '@/view/components/NavBar';

const DEFAULT_AVATAR = require('../assets/images/default_profile.jpg');

export default function ChatScreen() {
  const [avatarUrl, setAvatarUrl] = useState<any>(DEFAULT_AVATAR);
  const [verificationStatus, setVerificationStatus] = useState<'verified' | 'pending' | 'not_verified'>('not_verified');

  useEffect(() => {
    getProfile().then((result) => {
      if (result.success && result.data) {
        if (result.data.avatarUrl) setAvatarUrl({ uri: result.data.avatarUrl });
        setVerificationStatus(result.data.verificationStatus);
      }
    });
  }, []);

  return (
    <View className="flex-1 bg-white">
      <Header avatarUrl={avatarUrl} verificationStatus={verificationStatus} />
      <View className="flex-1" />
      <NavBar />
    </View>
  );
}
