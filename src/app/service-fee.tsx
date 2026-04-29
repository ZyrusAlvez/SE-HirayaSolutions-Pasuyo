import { View } from 'react-native';
import { useProfile } from '@/context/ProfileContext';
import Header from '@/view/components/Header';
import NavBar from '@/view/components/NavBar';

export default function ServiceFeeScreen() {
  const { avatarUrl, verificationStatus } = useProfile();

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <Header avatarUrl={avatarUrl} verificationStatus={verificationStatus} />
      <View style={{ flex: 1 }} />
      <NavBar />
    </View>
  );
}
