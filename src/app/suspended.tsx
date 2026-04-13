import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import { useRouter } from 'expo-router';

export default function SuspendedScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <View className="bg-white rounded-3xl p-8 items-center max-w-md w-full border border-gray-100">
        <View className="bg-red-100 rounded-full p-4 mb-4">
          <Ionicons name="ban" size={48} color="#EF4444" />
        </View>
        
        <Text className="text-xl font-bold text-gray-900 text-center mb-2">
          Account Suspended
        </Text>
        
        <Text className="text-sm text-gray-600 text-center mb-6">
          Your account has been temporarily suspended. Please reach out to our admin team for more information.
        </Text>
        
        <View className="bg-orange-50 rounded-xl p-4 mb-6 w-full">
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="mail" size={16} color="#FEA405" />
            <Text className="text-xs font-semibold text-gray-700">Contact Support</Text>
          </View>
          <Text className="text-xs text-gray-600">support@pasuyo.com</Text>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.8}
          className="bg-gray-800 rounded-2xl py-3 px-8 w-full items-center"
        >
          <Text className="text-white font-bold text-sm">Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
