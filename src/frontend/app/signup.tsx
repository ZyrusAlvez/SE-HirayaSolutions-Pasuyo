import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });
    setLoading(false);

    if (error) {
      Alert.alert('Signup Failed', error.message);
    } else if (data.user) {
      router.replace('/welcome');
    }
  };

  return (
    <View className="flex-1 bg-gradient-to-b from-orange-50 to-white justify-center p-6">
      <View className="mb-12">
        <Text className="text-4xl font-bold text-[#FEA405] mb-2 text-center">
          Join Pasuyo
        </Text>
        <Text className="text-lg text-gray-600 text-center">
          Start earning or get help today
        </Text>
      </View>
      
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">Full Name</Text>
        <TextInput
          className="bg-white border-2 border-gray-200 rounded-xl p-4 text-base"
          placeholder="Enter your name"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
        <TextInput
          className="bg-white border-2 border-gray-200 rounded-xl p-4 text-base"
          placeholder="Enter your email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View className="mb-6">
        <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
        <View className="relative">
          <TextInput
            className="bg-white border-2 border-gray-200 rounded-xl p-4 pr-12 text-base"
            placeholder="Create a password"
            placeholderTextColor="#999"
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
              size={24} 
              color="#FEA405" 
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        className="bg-[#FEA405] p-4 rounded-xl shadow-lg"
        onPress={handleSignup}
        disabled={loading}
      >
        <Text className="text-white text-lg font-bold text-center">
          {loading ? 'Creating Account...' : 'Sign Up'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        className="mt-6"
        onPress={() => router.push('/login')}
        activeOpacity={0.7}
      >
        <Text className="text-center text-base text-gray-600">
          Already have an account? <Text className="text-[#FEA405] font-bold">Login</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
