import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { toast } from '../utils/toast';
import { sendResetCode, verifyResetCode, updatePassword, getSession } from '@/controllers/authController';
import PasswordInput from '@/view/components/PasswordInput';
import PasswordStrength from '@/view/components/PasswordStrength';
import CircleCountdown from '@/view/components/CircleCountdown';

type Step = 'email' | 'code' | 'password';

export default function ResetPasswordScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const fromProfile = from === 'profile';
  const [step, setStep] = useState<Step>(fromProfile ? 'code' : 'email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval>>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const startCooldown = useCallback(() => {
    setCooldown(30);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => setCooldown(c => {
      if (c <= 1) { clearInterval(cooldownRef.current); return 0; }
      return c - 1;
    }), 1000);
  }, []);

  useEffect(() => {
    if (fromProfile) {
      getSession().then(({ data }) => {
        const mail = data?.session?.user?.email;
        if (mail) { setEmail(mail); sendCode(mail); }
      });
    }
    return () => clearInterval(cooldownRef.current);
  }, []);

  const sendCode = async (target: string) => {
    setLoading(true);
    const result = await sendResetCode(target);
    setLoading(false);
    if (!result.success) {
      toast({ title: result.error, preset: 'error' });
    } else {
      toast({ title: 'Code sent! Check your inbox.', preset: 'done' });
      startCooldown();
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
    code:     { title: 'Enter Code',       subtitle: 'Send a verification code to your email.' },
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
            <View className="flex-row mb-6 gap-2">
              <TextInput
                className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-base tracking-widest"
                placeholder="Paste code from email"
                placeholderTextColor="#9CA3AF"
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {cooldown > 0 ? (
                <View className="justify-center">
                  <CircleCountdown seconds={cooldown} total={30} />
                </View>
              ) : (
                <TouchableOpacity
                  testID="resend-code-btn"
                  className="bg-gray-100 border border-gray-200 px-4 rounded-2xl justify-center"
                  onPress={() => sendCode(email)}
                  disabled={loading || !email}
                  activeOpacity={0.8}
                >
                  <Text className="text-gray-700 text-sm font-semibold">
                    {loading ? 'Sending...' : 'Send Code'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {step === 'password' && (
            <View className="mb-6 gap-4">
              <PasswordInput
                placeholder="New Password"
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
              />
              {password.length > 0 && <PasswordStrength password={password} />}
              <PasswordInput
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
              />
            </View>
          )}

          <TouchableOpacity
            className="bg-[#FEA405] py-4 rounded-2xl"
            onPress={step === 'email' ? handleSendEmail : step === 'code' ? handleVerifyCode : handleUpdatePassword}
            disabled={loading}
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
