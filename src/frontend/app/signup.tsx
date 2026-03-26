import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { signInWithGoogle } from '../lib/authService';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { toast } from '../lib/toast';
import { setPendingRedirect } from '../lib/redirectStore';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const handleSignup = async () => {
    if (!name || !email || !password) {
      toast({ title: 'Please fill in all fields', preset: 'error' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Password must be at least 6 characters', preset: 'error' });
      return;
    }

    setLoading(true);
    if (redirect) setPendingRedirect(redirect);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          avatar_url: 'default',
        },
      },
    });
    setLoading(false);

    if (error) {
      toast({ title: 'Invalid email or password', preset: 'error' });
    } else if (data.user) {
      router.replace((redirect as string) || '/');
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      if (redirect) setPendingRedirect(redirect);
      await signInWithGoogle();
    } catch (error: any) {
      toast({ title: 'Google signup failed', preset: 'error' });
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
              Start earning or get help today
            </Text>
          </View>
          
          <View className="mb-4">
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-base"
              placeholder="Display Name"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
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
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-semibold text-center">
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-4 text-gray-400 text-sm">OR</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          <TouchableOpacity 
            className="bg-white border border-gray-200 py-4 rounded-2xl flex-row items-center justify-center"
            onPress={handleGoogleSignup}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Image 
              source={require('../assets/images/google-logo.png')}
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
            />
            <Text className="text-gray-700 text-base font-semibold ml-2">
              Continue with Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="mt-6"
            onPress={() => router.push(redirect ? `/login?redirect=${redirect}` : '/login')}
            activeOpacity={0.7}
          >
            <Text className="text-center text-sm text-gray-600">
              Already have an account? <Text className="text-[#FEA405] font-semibold">Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
