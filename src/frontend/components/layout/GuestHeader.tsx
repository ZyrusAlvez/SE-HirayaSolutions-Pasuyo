import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';

export default function GuestHeader() {
  const router = useRouter();
  return (
    <View className={`bg-white px-6 pb-4 flex-row items-center justify-between border-b border-gray-100 ${Platform.OS !== 'web' ? 'pt-12' : 'pt-4'}`}>
      <Image
        source={require('../../assets/logo/Pasuyo_full.png')}
        style={{ width: 120, height: 40 }}
        resizeMode="contain"
      />
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.push('/login')} activeOpacity={0.7}
          style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>Log In</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/signup')} activeOpacity={0.7}
          style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#FEA405' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: 'white' }}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
