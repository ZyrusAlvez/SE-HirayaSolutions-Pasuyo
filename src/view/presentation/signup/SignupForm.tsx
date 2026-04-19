import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import PasswordInput from '@/view/components/PasswordInput';

const checks = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'Has uppercase letter (A-Z)' },
  { test: (p: string) => /[a-z]/.test(p), label: 'Has lowercase letter (a-z)' },
  { test: (p: string) => /[0-9]/.test(p), label: 'Has a number (0-9)' },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'Has special character (!@#$)' },
];

const PasswordStrength = ({ password }: { password: string }) => {
  const metCount = checks.filter(c => c.test(password)).length;
  const color = metCount <= 2 ? 'bg-red-400' : metCount <= 4 ? 'bg-yellow-400' : 'bg-green-500';
  const label = metCount <= 2 ? 'Weak' : metCount <= 4 ? 'Fair' : 'Strong';

  return (
    <View className="mt-2 mb-2 px-1">
      <View className="flex-row gap-1 mb-2">
        {checks.map((_, i) => (
          <View key={i} className={`flex-1 h-1.5 rounded-full ${i < metCount ? color : 'bg-gray-200'}`} />
        ))}
      </View>
      <View className="flex-row justify-between">
        <Text className={`text-xs font-medium ${metCount <= 2 ? 'text-red-400' : metCount <= 4 ? 'text-yellow-500' : 'text-green-500'}`}>
          {label}
        </Text>
      </View>
      <View className="mt-1">
        {checks.map((c, i) => (
          <Text key={i} className={`text-xs mt-0.5 ${c.test(password) ? 'text-green-500' : 'text-gray-400'}`}>
            {c.test(password) ? '✓' : '○'}  {c.label}
          </Text>
        ))}
      </View>
    </View>
  );
};

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

      {password.length > 0 && <PasswordStrength password={password} />}

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
