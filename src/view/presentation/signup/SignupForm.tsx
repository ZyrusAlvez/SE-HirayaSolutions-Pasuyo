import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import PasswordInput from '@/view/components/PasswordInput';

type Props = {
  name: string;
  email: string;
  password: string;
  loading: boolean;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onSignup: () => void;
  onGoogleSignup: () => void;
  onLogin: () => void;
};

export default function SignupForm({
  name,
  email,
  password,
  loading,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onSignup,
  onGoogleSignup,
  onLogin,
}: Props) {
  return (
    <View>
      <View className="items-center mb-12">
        <Image
          source={require('../../../assets/logo/Pasuyo_full.png')}
          style={{ width: 192, height: 64 }}
          resizeMode="contain"
        />
        <Text className="text-base text-gray-500 mt-2">Start earning or get help today</Text>
      </View>

      <View className="mb-4">
        <TextInput
          className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-base"
          placeholder="Display Name"
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={onNameChange}
          autoCapitalize="words"
        />
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

      <PasswordInput
        placeholder="Password"
        value={password}
        onChangeText={onPasswordChange}
        autoCapitalize="none"
      />

      <TouchableOpacity
        className="bg-[#FEA405] py-4 rounded-2xl"
        onPress={onSignup}
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
        onPress={onGoogleSignup}
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

      <TouchableOpacity className="mt-6" onPress={onLogin} activeOpacity={0.7}>
        <Text className="text-center text-sm text-gray-600">
          Already have an account? <Text className="text-[#FEA405] font-semibold">Login</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
