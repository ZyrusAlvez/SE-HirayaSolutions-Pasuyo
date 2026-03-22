import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SuccessScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLarge = width >= 768;
  const contentWidth = isLarge ? Math.min(width * 0.55, 640) : undefined;

  return (
    <View className="flex-1 bg-white justify-center items-center px-6">
      <View style={{ width: contentWidth, alignItems: 'center' }}>
      <View className="bg-orange-100 rounded-full p-6 mb-6">
        <Ionicons name="checkmark-circle" size={80} color="#FEA405" />
      </View>
      <Text className="text-2xl font-bold text-gray-800 mb-3">Verification Submitted!</Text>
      <Text className="text-center text-gray-500 mb-10 leading-6">
        We'll review your documents and notify you once verified. This usually takes 1–3 business days.
      </Text>
      <TouchableOpacity
        className="bg-[#FEA405] py-4 px-10 rounded-2xl"
        onPress={() => router.replace('/profile')}
        activeOpacity={0.8}
      >
        <Text className="text-white text-base font-semibold">Go to Profile</Text>
      </TouchableOpacity>
      </View>
    </View>
  );
}
