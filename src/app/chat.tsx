import { View } from 'react-native';
import { useProfile } from '@/context/ProfileContext';
import Header from '@/view/components/Header';
import NavBar from '@/view/components/NavBar';

export default function ChatScreen() {
  const { avatarUrl, verificationStatus } = useProfile();

  return (
    <View className="flex-1 bg-white">
      <Header avatarUrl={avatarUrl} verificationStatus={verificationStatus} />
      <View className="flex-1" />
      <NavBar />
    </View>
  );
}
