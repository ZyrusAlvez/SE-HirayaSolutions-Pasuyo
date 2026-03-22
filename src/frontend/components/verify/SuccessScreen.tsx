import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SuccessScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white justify-center items-center px-6">
      <View className="bg-green-100 rounded-full p-6 mb-6">
        <Ionicons name="checkmark-circle" size={80} color="#16a34a" />
      </View>
      <Text className="text-2xl font-bold text-gray-800 mb-2">Verification Submitted!</Text>
      <Text className="text-center text-gray-600 mb-8">
        Your verification request has been submitted. We'll review it and notify you soon.
      </Text>
      <TouchableOpacity
        className="bg-[#FEA405] py-4 px-8 rounded-2xl"
        onPress={() => router.replace('/profile')}
        activeOpacity={0.8}
      >
        <Text className="text-white text-base font-semibold">Back to Profile</Text>
      </TouchableOpacity>
    </View>
  );
}
