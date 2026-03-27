import { View, TouchableOpacity, Image, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const DEFAULT_AVATAR = require('../../assets/images/default_profile.jpg');

interface Props {
  avatarUrl?: any;
  isVerified?: boolean;
}

export default function Header({ avatarUrl, isVerified }: Props) {
  const router = useRouter();
  const isWeb = Platform.OS === 'web';
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
        <TouchableOpacity onPress={() => router.push('/profile')} activeOpacity={0.7}>
          <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#FACC15', alignItems: 'center', justifyContent: 'center' }}>
            <Image
              source={avatarUrl ?? DEFAULT_AVATAR}
              style={{ width: 34, height: 34, borderRadius: 17 }}
              resizeMode="cover"
            />
            {isVerified && (
              <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#fff', borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="verified" size={14} color="#1D9BF0" />
              </View>
            )}
          </View>
        </TouchableOpacity>
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
