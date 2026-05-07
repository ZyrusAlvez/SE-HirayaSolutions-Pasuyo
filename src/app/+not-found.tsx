import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const LOGO = require('../assets/logo/Pasuyo_full.png');

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Image source={LOGO} style={{ height: 32, width: 120, marginBottom: 32 }} resizeMode="contain" />

      <View style={{ backgroundColor: '#FEF3C7', borderRadius: 999, padding: 16, marginBottom: 16 }}>
        <Ionicons name="compass-outline" size={48} color="#FEA405" />
      </View>

      <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 8 }}>
        Page Not Found
      </Text>

      <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 32, lineHeight: 20 }}>
        The page you're looking for doesn't exist or has been moved.
      </Text>

      <TouchableOpacity
        onPress={() => router.replace('/')}
        activeOpacity={0.8}
        style={{ backgroundColor: '#FEA405', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, width: '100%', maxWidth: 300, alignItems: 'center' }}
      >
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Go Home</Text>
      </TouchableOpacity>
    </View>
  );
}
