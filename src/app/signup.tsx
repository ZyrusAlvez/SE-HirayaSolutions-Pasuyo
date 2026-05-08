import { useState } from 'react';
import { View, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { signup, loginWithGoogle } from '@/controllers/authController';
import { toast } from '@/utils/toast';
import SignupForm from '@/view/presentation/signup/SignupForm';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const handleSignup = async () => {
    setLoading(true);
    const result = await signup(name, email, password);
    setLoading(false);

    if (!result.success) {
      toast({ title: result.error!, preset: 'error' });
    } else {
      router.replace((redirect as any) || '/');
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    const result = await loginWithGoogle();
    setLoading(false);
    if (!result.success) toast({ title: result.error!, preset: 'error' });
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 bg-white justify-center items-center p-6">
        <View className={`w-full ${isLargeScreen ? 'max-w-md' : ''}`}>
          <SignupForm
            name={name}
            email={email}
            password={password}
            loading={loading}
            onNameChange={setName}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSignup={handleSignup}
            onGoogleSignup={handleGoogleSignup}
            onLogin={() => router.push(redirect ? `/login?redirect=${redirect}` : '/login')}
          />
        </View>
      </View>
    </ScrollView>
  );
}
