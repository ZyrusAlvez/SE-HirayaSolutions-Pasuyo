import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';

type Status = 'verified' | 'pending' | 'not_verified';

export default function VerificationBadge({ status }: { status: Status }) {
  if (status === 'verified') {
    return (
      <View className="mt-2 px-3 py-1 rounded-full flex-row items-center gap-1 bg-blue-50">
        <MaterialIcons name="verified" size={14} color="#1D9BF0" />
        <Text className="text-xs font-semibold text-blue-500">Verified</Text>
      </View>
    );
  }

  const config = {
    pending:      { bg: 'bg-yellow-100', text: 'text-yellow-700', color: '#d97706', icon: 'time-outline',          label: 'Pending Verification' },
    not_verified: { bg: 'bg-gray-100',   text: 'text-gray-500',   color: '#6b7280', icon: 'close-circle-outline', label: 'Not Verified' },
  } as const;

  const { bg, text, color, icon, label } = config[status];
  return (
    <View className={`mt-2 px-3 py-1 rounded-full flex-row items-center gap-1 ${bg}`}>
      <Ionicons name={icon} size={14} color={color} />
      <Text className={`text-xs font-semibold ${text}`}>{label}</Text>
    </View>
  );
}
