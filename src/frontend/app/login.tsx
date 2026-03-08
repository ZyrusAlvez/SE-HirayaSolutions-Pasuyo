import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, ScrollView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { signInWithGoogle } from '../lib/authService';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Login Failed', error.message);
    } else if (data.user) {
      router.replace('/home');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      router.replace('/home');
    } catch (error: any) {
      Alert.alert('Google Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 bg-white justify-center items-center p-6">
        <View className={`w-full ${isLargeScreen ? 'max-w-md' : ''}`}>
          <View className="items-center mb-12">
            <Image 
              source={require('../assets/logo/Pasuyo_full.png')}
              style={{ width: 192, height: 64 }}
              resizeMode="contain"
            />
            <Text className="text-base text-gray-500 mt-2">
              Your errands, simplified
            </Text>
          </View>
          
          <View className="mb-4">
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-base"
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View className="mb-6">
            <View className="relative">
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 pr-12 text-base"
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                className="absolute right-4 top-4"
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? 'eye-off' : 'eye'} 
                  size={22} 
                  color="#9CA3AF" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            className="bg-[#FEA405] py-4 rounded-2xl"
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-semibold text-center">
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-4 text-gray-400 text-sm">OR</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          <TouchableOpacity 
            className="bg-white border border-gray-200 py-4 rounded-2xl flex-row items-center justify-center"
            onPress={handleGoogleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-google" size={20} color="#DB4437" />
            <Text className="text-gray-700 text-base font-semibold ml-2">
              Continue with Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="mt-6"
            onPress={() => router.push('/signup')}
            activeOpacity={0.7}
          >
            <Text className="text-center text-sm text-gray-600">
              Don't have an account? <Text className="text-[#FEA405] font-semibold">Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
