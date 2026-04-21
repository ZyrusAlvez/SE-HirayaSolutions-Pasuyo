import { View, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';

const DEFAULT_AVATAR = require('../../../assets/images/default_profile.jpg');

type Props = {
  avatarUrl: any;
  size?: number;
  onPress: () => void;
};

export default function AvatarPicker({ avatarUrl, size = 112, onPress }: Props) {
  const [imgSrc, setImgSrc] = useState(avatarUrl ?? DEFAULT_AVATAR);

  useEffect(() => {
    setImgSrc(avatarUrl ?? DEFAULT_AVATAR);
  }, [avatarUrl]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View className="relative">
        <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 4, borderColor: '#fff', backgroundColor: '#E5E7EB', overflow: 'hidden' }}>
          <Image source={imgSrc} onError={() => setImgSrc(DEFAULT_AVATAR)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
        <View className="absolute bottom-0 right-0 bg-[#FEA405] rounded-full p-2">
          <Ionicons name="camera" size={16} color="white" />
        </View>
      </View>
    </TouchableOpacity>
  );
}
