import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const [userName, setUserName] = useState('');
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

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
    <View className="flex-1 bg-white justify-center items-center p-6">
      <View className={`w-full ${isLargeScreen ? 'max-w-md' : ''}`}>
        <View className="items-center mb-12">
          <Image 
            source={require('../assets/logo/Pasuyo_full.png')}
            style={{ width: 192, height: 64 }}
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold text-gray-800 mb-2 mt-8">
            Welcome back!
          </Text>
          <Text className="text-xl text-[#FEA405] font-semibold">
            {userName}
          </Text>
        </View>
        
        <Text className="text-center text-gray-500 text-base mb-8">
          You're now part of the Pasuyo community
        </Text>

        <TouchableOpacity 
          className="bg-[#FEA405] py-4 rounded-2xl"
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
