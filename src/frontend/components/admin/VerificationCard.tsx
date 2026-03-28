import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const DEFAULT_AVATAR = require('../../assets/images/default_profile.jpg');

export interface PendingUser {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  verification_submitted_at: string | null;
  id_type: string | null;
}

interface Props {
  user: PendingUser;
}

export default function VerificationCard({ user }: Props) {
  const router = useRouter();
  const submittedAt = user.verification_submitted_at
    ? new Date(user.verification_submitted_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push(`/admin/verification/${user.id}`)}
      className="bg-white rounded-2xl px-4 py-3 flex-row items-center gap-3 border border-gray-100"
    >
      <Image
        source={user.avatar_url ? { uri: user.avatar_url } : DEFAULT_AVATAR}
        style={{ width: 44, height: 44, borderRadius: 22 }}
        resizeMode="cover"
      />
      <View className="flex-1">
        <Text className="text-sm font-semibold text-gray-900">{user.display_name || 'No name set'}</Text>
        <Text className="text-xs text-gray-500" numberOfLines={1}>{user.email ?? '—'}</Text>
        <Text className="text-xs text-gray-400 mt-0.5">Submitted {submittedAt}</Text>
      </View>
      <View className="items-end gap-1">
        <View className="bg-yellow-100 px-2 py-1 rounded-full">
          <Text className="text-xs font-medium text-yellow-700">Pending</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
      </View>
    </TouchableOpacity>
  );
}
