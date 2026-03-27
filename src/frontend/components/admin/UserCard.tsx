import { View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DEFAULT_AVATAR = require('../../assets/images/default_profile.jpg');

export interface UserProfile {
  id: string;
  display_name: string | null;
  email: string | null;
  verified: boolean;
  role: string | null;
  created_at: string;
  rating: number | null;
}

interface Props {
  user: UserProfile;
}

export default function UserCard({ user }: Props) {
  const fullName = user.display_name || 'No name set';
  const joinedDate = new Date(user.created_at).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <View className="bg-white rounded-2xl px-4 py-3 flex-row items-center gap-3 border border-gray-100">
      <Image
        source={DEFAULT_AVATAR}
        style={{ width: 44, height: 44, borderRadius: 22 }}
        resizeMode="cover"
      />
      <View className="flex-1">
        <View className="flex-row items-center gap-1">
          <Text className="text-sm font-semibold text-gray-900">{fullName}</Text>
          {user.verified && (
            <Ionicons name="checkmark-circle" size={14} color="#FEA405" />
          )}
        </View>
        <Text className="text-xs text-gray-500" numberOfLines={1}>{user.email ?? '—'}</Text>
        <Text className="text-xs text-gray-400 mt-0.5">Joined {joinedDate}</Text>
      </View>
      <View className={`px-2 py-1 rounded-full ${user.verified ? 'bg-green-100' : 'bg-gray-100'}`}>
        <Text className={`text-xs font-medium ${user.verified ? 'text-green-700' : 'text-gray-500'}`}>
          {user.verified ? 'Verified' : 'Unverified'}
        </Text>
      </View>
    </View>
  );
}
