import { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DEFAULT_AVATAR from '../../../assets/images/default_profile.jpg';
import VerificationBadge from '../../components/VerificationBadge';
import KebabMenu from '../../components/KebabMenu';
import ConfirmModal from '../../components/ConfirmModal';
import ReasonModal from '../../components/ReasonModal';
import { updateUserActiveStatus } from '../../../controllers/adminController';
import { USER_REASONS } from '../../../controllers/reportController';
import { toast } from '@/utils/toast';

export interface UserProfile {
  id: string;
  display_name: string | null;
  email: string | null;
  status: string;
  role: string | null;
  created_at: string;
  rating: number | null;
  avatar_url?: string | null;
}

interface Props {
  user: UserProfile;
  onRefresh?: () => void;
  onLoadingChange?: (loading: boolean) => void;
}

export default function UserCard({ user, onRefresh, onLoadingChange }: Props) {
  const router = useRouter();
  const [avatarError, setAvatarError] = useState(false);
  const [suspendVisible, setSuspendVisible] = useState(false);
  const [restoreVisible, setRestoreVisible] = useState(false);
  const fullName = user.display_name || 'No name set';
  const joinedDate = new Date(user.created_at).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  const handleSuspend = async (reason: string) => {
    setSuspendVisible(false);
    onLoadingChange?.(true);
    const result = await updateUserActiveStatus(user.id, true, reason);
    onLoadingChange?.(false);
    if (!result.success) { toast({ title: result.error, preset: 'error' }); return; }
    toast({ title: 'Account suspended.', preset: 'done' });
    onRefresh?.();
  };

  const handleRestore = async () => {
    setRestoreVisible(false);
    onLoadingChange?.(true);
    const result = await updateUserActiveStatus(user.id, false);
    onLoadingChange?.(false);
    if (!result.success) { toast({ title: result.error, preset: 'error' }); return; }
    toast({ title: 'Account restored.', preset: 'done' });
    onRefresh?.();
  };

  return (
    <View
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
        {user.status === 'suspended' ? (
          <View className="px-2 py-1 rounded-full bg-red-100">
            <Text className="text-xs font-medium text-red-500">Suspended</Text>
          </View>
        ) : (
          <VerificationBadge status={user.status === 'verified' ? 'verified' : user.status === 'pending' ? 'pending' : 'not_verified'} />
        )}
      </View>
      <KebabMenu actions={[
        { label: 'More info', icon: 'information-circle-outline', onPress: () => router.push(`/admin/account/${user.id}`) },
        { label: 'Suspend', icon: 'ban-outline', onPress: () => setSuspendVisible(true), disabled: user.status === 'suspended' },
        { label: 'Restore', icon: 'checkmark-circle-outline', onPress: () => setRestoreVisible(true), disabled: user.status !== 'suspended' },
      ]} />

      {/* Suspend Modal */}
      <ReasonModal
        visible={suspendVisible}
        title="Suspend Account"
        description={`Select a reason for suspending ${fullName}.`}
        reasons={USER_REASONS}
        confirmLabel="Suspend"
        onClose={() => setSuspendVisible(false)}
        onConfirm={handleSuspend}
      />

      {/* Restore Modal */}
      <ConfirmModal
        visible={restoreVisible}
        title="Restore Account"
        message={`Are you sure you want to restore ${fullName}'s account?`}
        confirmLabel="Restore"
        onCancel={() => setRestoreVisible(false)}
        onConfirm={handleRestore}
      />
    </View>
  );
}
