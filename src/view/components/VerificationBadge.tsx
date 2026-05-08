import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';

export type VerificationStatus = 'verified' | 'pending' | 'not_verified';

interface Props {
  status: VerificationStatus;
  /** 'badge' shows the full pill label (default), 'icon' shows just the verified checkmark overlay */
  variant?: 'badge' | 'icon';
}

export default function VerificationBadge({ status, variant = 'badge' }: Props) {
  if (variant === 'icon') {
    if (status !== 'verified') return null;
    return (
      <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#fff', borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
        <MaterialIcons name="verified" size={14} color="#1D9BF0" />
      </View>
    );
  }

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
