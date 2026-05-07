import { useState } from 'react';
import { View, Text, Image, Modal, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DEFAULT_AVATAR from '../../../assets/images/default_profile.jpg';
import VerificationBadge from '../../components/VerificationBadge';
import KebabMenu from '../../components/KebabMenu';
import ConfirmModal from '../../components/ConfirmModal';
import { updateUserActiveStatus } from '../../../controllers/adminController';

const SUSPEND_REASONS = [
  'Violation of platform rules',
  'Fraudulent activity',
  'Harassment or abusive behavior',
  'Spam or misleading content',
  'Multiple user reports',
  'Unpaid service fees',
  'Fake or unverified identity',
  'Other',
];

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
}

export default function UserCard({ user, onRefresh }: Props) {
  const router = useRouter();
  const [avatarError, setAvatarError] = useState(false);
  const [suspendVisible, setSuspendVisible] = useState(false);
  const [restoreVisible, setRestoreVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState(SUSPEND_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const fullName = user.display_name || 'No name set';
  const joinedDate = new Date(user.created_at).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  const handleSuspend = async () => {
    const reason = selectedReason === 'Other' ? customReason.trim() : selectedReason;
    if (!reason) return;
    setSuspendVisible(false);
    await updateUserActiveStatus(user.id, true, reason);
    onRefresh?.();
  };

  const handleRestore = async () => {
    setRestoreVisible(false);
    await updateUserActiveStatus(user.id, false);
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
        { label: 'More info', icon: 'information-circle-outline', onPress: () => router.push(`/admin/user/${user.id}`) },
        { label: 'Suspend', icon: 'ban-outline', onPress: () => setSuspendVisible(true), disabled: user.status === 'suspended' },
        { label: 'Restore', icon: 'checkmark-circle-outline', onPress: () => setRestoreVisible(true), disabled: user.status !== 'suspended' },
      ]} />

      {/* Suspend Modal with Reason */}
      <Modal visible={suspendVisible} transparent animationType="fade" onRequestClose={() => setSuspendVisible(false)}>
        <TouchableOpacity style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)' }} activeOpacity={1} onPress={() => setSuspendVisible(false)}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: 16, width: 320, maxHeight: 460, padding: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 }}>Suspend Account</Text>
            <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 19, marginBottom: 16 }}>
              Select a reason for suspending {fullName}.
            </Text>

            <ScrollView style={{ maxHeight: 280, marginBottom: 16 }}>
              {SUSPEND_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  activeOpacity={0.7}
                  onPress={() => setSelectedReason(reason)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: selectedReason === reason ? '#FEF2F2' : 'transparent', borderWidth: 1, borderColor: selectedReason === reason ? '#FECACA' : '#F3F4F6', marginBottom: 6 }}
                >
                  <Ionicons
                    name={selectedReason === reason ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={selectedReason === reason ? '#EF4444' : '#D1D5DB'}
                  />
                  <Text style={{ fontSize: 13, color: selectedReason === reason ? '#991B1B' : '#374151', fontWeight: selectedReason === reason ? '600' : '400', flex: 1 }}>{reason}</Text>
                </TouchableOpacity>
              ))}
              {selectedReason === 'Other' && (
                <TextInput
                  placeholder="Enter custom reason..."
                  placeholderTextColor="#9CA3AF"
                  value={customReason}
                  onChangeText={setCustomReason}
                  multiline
                  style={{ borderWidth: 1, borderColor: '#FECACA', borderRadius: 10, padding: 12, fontSize: 13, color: '#1F2937', minHeight: 60, marginTop: 4, backgroundColor: '#FEF2F2' } as any}
                />
              )}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setSuspendVisible(false)} activeOpacity={0.7} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSuspend} activeOpacity={0.7} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: (selectedReason === 'Other' && !customReason.trim()) ? '#FCA5A5' : '#EF4444', alignItems: 'center' }} disabled={selectedReason === 'Other' && !customReason.trim()}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Suspend</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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
