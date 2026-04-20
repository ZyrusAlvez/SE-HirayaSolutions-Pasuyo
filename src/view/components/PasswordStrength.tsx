import { View, Text } from 'react-native';
import { passwordChecks } from '@/controllers/authController';

export default function PasswordStrength({ password }: { password: string }) {
  const metCount = passwordChecks.filter(c => c.test(password)).length;
  const color = metCount <= 2 ? 'bg-red-400' : metCount <= 4 ? 'bg-yellow-400' : 'bg-green-500';
  const label = metCount <= 2 ? 'Weak' : metCount <= 4 ? 'Fair' : 'Strong';

  return (
    <View className="mt-2 mb-2 px-1">
      <View className="flex-row gap-1 mb-2">
        {passwordChecks.map((_, i) => (
          <View key={i} className={`flex-1 h-1.5 rounded-full ${i < metCount ? color : 'bg-gray-200'}`} />
        ))}
      </View>
      <View className="flex-row justify-between">
        <Text className={`text-xs font-medium ${metCount <= 2 ? 'text-red-400' : metCount <= 4 ? 'text-yellow-500' : 'text-green-500'}`}>
          {label}
        </Text>
      </View>
      <View className="mt-1">
        {passwordChecks.map((c, i) => (
          <Text key={i} className={`text-xs mt-0.5 ${c.test(password) ? 'text-green-500' : 'text-gray-400'}`}>
            {c.test(password) ? '✓' : '○'}  {c.label}
          </Text>
        ))}
      </View>
    </View>
  );
}
