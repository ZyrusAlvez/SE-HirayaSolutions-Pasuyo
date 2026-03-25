import { View, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const DEFAULT_AVATAR = require('../../assets/images/default_profile.jpg');

interface Props {
  avatarUrl: any;
}

export default function HomeHeader({ avatarUrl }: Props) {
  const router = useRouter();
  return (
    <View className={`bg-white px-6 pb-4 flex-row items-center justify-between border-b border-gray-100 ${Platform.OS !== 'web' ? 'pt-12' : 'pt-4'}`}>
      <TouchableOpacity className="p-2" activeOpacity={0.7}>
        <Ionicons name="menu" size={28} color="#000" />
      </TouchableOpacity>
      <Image
        source={require('../../assets/logo/Pasuyo_full.png')}
        style={{ width: 120, height: 40 }}
        resizeMode="contain"
      />
      <TouchableOpacity onPress={() => router.push('/profile')} activeOpacity={0.7}>
        <Image
          source={avatarUrl ?? DEFAULT_AVATAR}
          style={{ width: 36, height: 36, borderRadius: 18 }}
          resizeMode="cover"
        />
      </TouchableOpacity>
    </View>
  );
}
