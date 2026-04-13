import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onTogglePassword: () => void;
  onLogin: () => void;
  onGoogleLogin: () => void;
  onForgotPassword: () => void;
  onSignup: () => void;
};

export default function LoginForm({
  email,
  password,
  showPassword,
  loading,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onLogin,
  onGoogleLogin,
  onForgotPassword,
  onSignup,
}: Props) {
  return (
    <View>
      <View className="items-center mb-12">
        <Image
          source={require('../../../assets/logo/Pasuyo_full.png')}
          style={{ width: 192, height: 64 }}
          resizeMode="contain"
        />
        <Text className="text-base text-gray-500 mt-2">Your errands, simplified</Text>
      </View>

      <View className="mb-4">
        <TextInput
          className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-base"
          placeholder="Email"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={onEmailChange}
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
            onChangeText={onPasswordChange}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity className="absolute right-4 top-4" onPress={onTogglePassword}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-row items-center my-6">
        <View className="flex-1 h-px bg-gray-200" />
        <Text className="mx-4 text-gray-400 text-sm">OR</Text>
        <View className="flex-1 h-px bg-gray-200" />
      </View>

      <TouchableOpacity
        className="bg-white border border-gray-200 py-4 rounded-2xl flex-row items-center justify-center"
        onPress={onGoogleLogin}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Image
          source={require('../../../assets/images/google-logo.png')}
          style={{ width: 20, height: 20 }}
          resizeMode="contain"
        />
        <Text className="text-gray-700 text-base font-semibold ml-2">Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity className="mt-4 self-end" onPress={onForgotPassword} activeOpacity={0.7}>
        <Text className="text-sm text-[#FEA405] font-semibold">Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="mt-6 bg-[#FEA405] py-4 rounded-2xl"
        onPress={onLogin}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text className="text-white text-base font-semibold text-center">
          {loading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity className="mt-6" onPress={onSignup} activeOpacity={0.7}>
        <Text className="text-center text-sm text-gray-600">
          Don't have an account? <Text className="text-[#FEA405] font-semibold">Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
