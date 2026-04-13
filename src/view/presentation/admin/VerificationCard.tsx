import { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DEFAULT_AVATAR from '../../../assets/images/default_profile.jpg';
import VerificationBadge from '../../components/VerificationBadge';

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
  const [avatarError, setAvatarError] = useState(false);
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
        source={!avatarError && user.avatar_url ? { uri: user.avatar_url } : DEFAULT_AVATAR}
        onError={() => setAvatarError(true)}
        style={{ width: 44, height: 44, borderRadius: 22 }}
        resizeMode="cover"
      />
      <View className="flex-1">
        <Text className="text-sm font-semibold text-gray-900">{user.display_name || 'No name set'}</Text>
        <Text className="text-xs text-gray-500" numberOfLines={1}>{user.email ?? '—'}</Text>
        <Text className="text-xs text-gray-400 mt-0.5">Submitted {submittedAt}</Text>
      </View>
      <View className="items-end gap-1">
        <VerificationBadge status="pending" />
        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
      </View>
    </TouchableOpacity>
  );
}
