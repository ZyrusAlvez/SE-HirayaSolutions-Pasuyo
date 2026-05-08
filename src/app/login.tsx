import { useState } from 'react';
import { View, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { login, loginWithGoogle } from '@/controllers/authController';
import { toast } from '@/utils/toast';
import LoginForm from '@/view/presentation/login/LoginForm';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const handleLogin = async () => {
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      toast({ title: result.error!, preset: 'error' });
    } else {
      router.replace(result.role === 'admin' ? '/admin' : (redirect as any) || '/');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await loginWithGoogle();
    setLoading(false);
    if (!result.success) toast({ title: result.error!, preset: 'error' });
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 bg-white justify-center items-center p-6">
        <View className={`w-full ${isLargeScreen ? 'max-w-md' : ''}`}>
          <LoginForm
            email={email}
            password={password}
            loading={loading}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onLogin={handleLogin}
            onGoogleLogin={handleGoogleLogin}
            onForgotPassword={() => router.push('/reset-password')}
            onSignup={() => router.push(redirect ? `/signup?redirect=${redirect}` : '/signup')}
          />
        </View>
      </View>
    </ScrollView>
  );
}
