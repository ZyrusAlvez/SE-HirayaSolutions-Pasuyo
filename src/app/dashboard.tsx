import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '@/context/ProfileContext';
import Header from '@/view/components/Header';
import NavBar from '@/view/components/NavBar';

export default function DashboardScreen() {
  const { avatarUrl, verificationStatus } = useProfile();

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <Header avatarUrl={avatarUrl} verificationStatus={verificationStatus} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      </View>
      <NavBar />
    </View>
  );
}
