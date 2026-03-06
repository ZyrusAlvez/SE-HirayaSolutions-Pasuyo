import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const [userName, setUserName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.name || 'User');
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <View className="flex-1 bg-gradient-to-b from-orange-50 to-white justify-center items-center p-6">
      <View className="bg-white rounded-3xl p-8 shadow-xl w-full max-w-md">
        <View className="items-center mb-8">
          <View className="bg-[#FEA405] w-20 h-20 rounded-full items-center justify-center mb-4">
            <Text className="text-white text-4xl">👋</Text>
          </View>
          <Text className="text-3xl font-bold text-gray-800 mb-2">
            Welcome!
          </Text>
          <Text className="text-xl text-[#FEA405] font-semibold">
            {userName}
          </Text>
        </View>
        
        <Text className="text-center text-gray-600 text-base mb-8">
          You're now part of the Pasuyo community
        </Text>

        <TouchableOpacity 
          className="bg-[#FEA405] px-8 py-4 rounded-xl shadow-lg"
          onPress={handleLogout}
        >
          <Text className="text-white text-lg font-bold text-center">
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
