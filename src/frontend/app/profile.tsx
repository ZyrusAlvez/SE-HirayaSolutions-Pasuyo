import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      router.replace('/login');
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="bg-[#FEA405] pt-12 pb-6 px-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Profile Settings</Text>
      </View>

      <View className="p-6">
        <TouchableOpacity
          className="bg-red-500 py-4 rounded-2xl"
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text className="text-white text-base font-semibold text-center">
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
