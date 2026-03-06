import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <View className="flex-1 bg-white justify-center p-6">
      <Text className="text-3xl font-bold text-[#DC143C] mb-10 text-center">
        Welcome to Pasuyo
      </Text>
      
      <View className="mb-4">
        <TextInput
          className="border border-gray-300 rounded-lg p-3.5 text-base"
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View className="mb-4 relative">
        <TextInput
          className="border border-gray-300 rounded-lg p-3.5 pr-12 text-base"
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity 
          className="absolute right-3 top-3 p-1"
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons 
            name={showPassword ? 'eye-off' : 'eye'} 
            size={24} 
            color="#DC143C" 
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        className="bg-[#DC143C] p-4 rounded-lg mt-6"
        onPress={handleLogin}
        disabled={loading}
      >
        <Text className="text-white text-base font-bold text-center">
          {loading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
