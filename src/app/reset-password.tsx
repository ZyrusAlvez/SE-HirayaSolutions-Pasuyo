import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { toast } from '../utils/toast';
import { sendResetCode, verifyResetCode, updatePassword } from '@/controllers/authController';
import PasswordInput from '@/view/components/PasswordInput';

type Step = 'email' | 'code' | 'password';

export default function ResetPasswordScreen() {
  const { from, email: paramEmail } = useLocalSearchParams<{ from?: string; email?: string }>();
  const fromProfile = from === 'profile';
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(paramEmail || '');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoSent, setAutoSent] = useState(false);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  useEffect(() => {
    if (fromProfile && paramEmail) sendCode(paramEmail);
  }, []);

  const sendCode = async (target: string) => {
    setLoading(true);
    const result = await sendResetCode(target);
    setLoading(false);
    if (!result.success) {
      toast({ title: result.error, preset: 'error' });
    } else {
      toast({ title: 'Code sent! Check your inbox.', preset: 'done' });
      setStep('code');
    }
  };

  const handleSendEmail = async () => {
    if (!email) { toast({ title: 'Please enter your email', preset: 'error' }); return; }
    await sendCode(email);
  };

  const handleVerifyCode = async () => {
    if (!token) { toast({ title: 'Please enter the code', preset: 'error' }); return; }
    setLoading(true);
    const result = await verifyResetCode(email, token);
    setLoading(false);
    if (!result.success) { toast({ title: result.error, preset: 'error' }); return; }
    setStep('password');
  };

  const handleUpdatePassword = async () => {
    setLoading(true);
    const result = await updatePassword(password, confirmPassword);
    setLoading(false);
    if (!result.success) { toast({ title: result.error, preset: 'error' }); return; }
    toast({ title: 'Password updated!', preset: 'done' });
    router.replace(fromProfile ? '/profile' : '/');
  };

  const stepConfig = {
    email:    { title: 'Forgot Password',  subtitle: 'Enter your email to receive a reset code.' },
    code:     { title: 'Enter Code',       subtitle: `We sent a code to ${email}` },
    password: { title: 'New Password',     subtitle: 'Choose a strong new password.' },
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 bg-white justify-center items-center p-6">
        <View className={`w-full ${isLargeScreen ? 'max-w-md' : ''}`}>

          <View className="items-center mb-10">
            <Image
              source={require('../assets/logo/Pasuyo_full.png')}
              style={{ width: 192, height: 64 }}
              resizeMode="contain"
            />
          </View>

          <View className="flex-row justify-center mb-8 gap-2">
            {(['email', 'code', 'password'] as Step[]).map((s, i) => (
              <View key={s} className={`h-2 rounded-full flex-1 ${step === s || (i < ['email','code','password'].indexOf(step)) ? 'bg-[#FEA405]' : 'bg-gray-200'}`} />
            ))}
          </View>

          <Text className="text-2xl font-bold text-gray-800 mb-1">{stepConfig[step].title}</Text>
          <Text className="text-sm text-gray-500 mb-6">{stepConfig[step].subtitle}</Text>

          {step === 'email' && (
            <TextInput
              className={`border border-gray-200 rounded-2xl px-4 py-4 text-base mb-6 ${fromProfile ? 'bg-gray-100 text-gray-400' : 'bg-gray-50'}`}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!fromProfile}
            />
          )}

          {step === 'code' && (
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-base mb-6 tracking-widest"
              placeholder="Paste code from email"
              placeholderTextColor="#9CA3AF"
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}

          {step === 'password' && (
            <View className="mb-6 gap-4">
              <PasswordInput
                placeholder="New Password"
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
              />
              <PasswordInput
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
              />
              <Text className="text-xs text-gray-400">Min. 6 characters</Text>
            </View>
          )}

          <TouchableOpacity
            className="bg-[#FEA405] py-4 rounded-2xl"
            onPress={step === 'email' ? handleSendEmail : step === 'code' ? handleVerifyCode : handleUpdatePassword}
            disabled={loading || (fromProfile && step === 'email' && !autoSent)}
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-semibold text-center">
              {loading ? 'Please wait...' : step === 'email' ? 'Send Code' : step === 'code' ? 'Verify Code' : 'Update Password'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="mt-6" onPress={() => router.replace(fromProfile ? '/profile' : '/login')} activeOpacity={0.7}>
            <Text className="text-center text-sm text-gray-600">
              Back to <Text className="text-[#FEA405] font-semibold">{fromProfile ? 'Profile' : 'Login'}</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </ScrollView>
  );
}
