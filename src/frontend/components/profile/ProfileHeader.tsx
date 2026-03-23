import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  contentWidth: number | undefined;
  onBack: () => void;
};

export default function ProfileHeader({ contentWidth, onBack }: Props) {
  return (
    <View className={`bg-[#FEA405] ${Platform.OS === 'web' ? 'pt-6' : 'pt-12'} pb-20 px-6 flex-row items-center w-full`}>
      <View style={{ width: contentWidth, flexDirection: 'row', alignItems: 'center', alignSelf: contentWidth ? 'center' : undefined }}>
        <TouchableOpacity onPress={onBack} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Profile Settings</Text>
      </View>
    </View>
  );
}
