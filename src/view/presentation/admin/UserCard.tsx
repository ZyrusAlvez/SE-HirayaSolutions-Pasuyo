import { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DEFAULT_AVATAR from '../../../assets/images/default_profile.jpg';
import VerificationBadge from '../../components/VerificationBadge';

export interface UserProfile {
  id: string;
  display_name: string | null;
  email: string | null;
  verified: boolean;
  role: string | null;
  created_at: string;
  rating: number | null;
  avatar_url?: string | null;
  is_active?: boolean;
}

interface Props {
  user: UserProfile;
}

export default function UserCard({ user }: Props) {
  const router = useRouter();
  const [avatarError, setAvatarError] = useState(false);
  const fullName = user.display_name || 'No name set';
  const joinedDate = new Date(user.created_at).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push(`/admin/user/${user.id}`)}
      className="bg-white rounded-2xl px-4 py-3 flex-row items-center gap-3 border border-gray-100"
    >
      <Image
        source={!avatarError && user.avatar_url ? { uri: user.avatar_url } : DEFAULT_AVATAR}
        onError={() => setAvatarError(true)}
        style={{ width: 44, height: 44, borderRadius: 22 }}
        resizeMode="cover"
      />
      <View className="flex-1">
        <View className="flex-row items-center gap-1">
          <Text className="text-sm font-semibold text-gray-900">{fullName}</Text>
        </View>
        <Text className="text-xs text-gray-500" numberOfLines={1}>{user.email ?? '—'}</Text>
        <Text className="text-xs text-gray-400 mt-0.5">Joined {joinedDate}</Text>
      </View>
      <View style={{ gap: 4, alignItems: 'flex-end' }}>
        <VerificationBadge status={user.verified ? 'verified' : 'not_verified'} />
        {user.is_active === false && (
          <View className="px-2 py-1 rounded-full bg-red-100">
            <Text className="text-xs font-medium text-red-500">Suspended</Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </TouchableOpacity>
  );
}
