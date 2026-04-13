import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Platform, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getUserDetail, updateUserActiveStatus, UserDetail } from '../../../controllers/adminController';
import DEFAULT_AVATAR from '../../../assets/images/default_profile.jpg';
import VerificationBadge from '../../../view/components/VerificationBadge';

const ACCENT = '#FEA405';

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [modal, setModal] = useState<{ visible: boolean; type: 'suspend' | 'restore' | null }>({ visible: false, type: null });

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    getUserDetail(id).then(result => {
      if (result.success && result.data) setUser(result.data);
      setLoading(false);
    });
  }, [id]);

  const handleConfirm = async () => {
    const suspending = modal.type === 'suspend';
    setModal({ visible: false, type: null });
    setActing(true);
    await updateUserActiveStatus(id!, suspending);
    setUser(prev => prev ? { ...prev, is_active: !suspending } : prev);
    setActing(false);
  };

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' }}>
      <Text className="text-gray-400 text-sm">Loading...</Text>
    </View>
  );

  if (!user) return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' }}>
      <Text className="text-gray-400 text-sm">User not found</Text>
    </View>
  );

  const joinedDate = new Date(user.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View className="flex-row justify-between py-2 border-b border-gray-50">
      <Text className="text-xs text-gray-400">{label}</Text>
      <Text className="text-xs text-gray-800 font-medium">{value}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <Modal visible={modal.visible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
              {modal.type === 'suspend' ? 'Suspend Account' : 'Restore Account'}
            </Text>
            <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>
              {modal.type === 'suspend'
                ? 'This will block the user from logging in. Are you sure?'
                : "This will restore the user's access. Are you sure?"}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setModal({ visible: false, type: null })}
                activeOpacity={0.8}
                style={{ flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirm}
                activeOpacity={0.8}
                style={{ flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: modal.type === 'suspend' ? '#EF4444' : ACCENT }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: 'white' }}>
                  {modal.type === 'suspend' ? 'Suspend' : 'Restore'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View className={`bg-white border-b border-gray-100 ${Platform.OS !== 'web' ? 'pt-12' : 'pt-2'} pb-3 px-4 flex-row items-center gap-3`}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">User Detail</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
        <View className="bg-white rounded-2xl p-4 border border-gray-100 items-center gap-2">
          <Image
            source={user.avatar_url ? { uri: user.avatar_url } : DEFAULT_AVATAR}
            style={{ width: 72, height: 72, borderRadius: 36 }}
            resizeMode="cover"
          />
          <Text className="text-base font-bold text-gray-900">{user.display_name || 'No name set'}</Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <VerificationBadge status={user.verified ? 'verified' : 'not_verified'} />
            <View className={`px-2 py-1 rounded-full ${user.is_active ? 'bg-blue-100' : 'bg-red-100'}`}>
              <Text className={`text-xs font-medium ${user.is_active ? 'text-blue-700' : 'text-red-500'}`}>
                {user.is_active ? 'Active' : 'Suspended'}
              </Text>
            </View>
          </View>
        </View>

        <View className="bg-white rounded-2xl p-4 border border-gray-100">
          <Text className="text-sm font-bold text-gray-700 mb-2">Account Info</Text>
          <InfoRow label="Email" value={user.email ?? '—'} />
          <InfoRow label="Role" value={user.role ?? '—'} />
          <InfoRow label="Rating" value={user.rating != null ? `${user.rating}` : '—'} />
          <InfoRow label="Joined" value={joinedDate} />
        </View>
      </ScrollView>

      <View className="bg-white border-t border-gray-100 px-4 py-4">
        <TouchableOpacity
          onPress={() => setModal({ visible: true, type: user.is_active ? 'suspend' : 'restore' })}
          disabled={acting}
          activeOpacity={0.85}
          style={{ borderRadius: 16, paddingVertical: 14, alignItems: 'center', backgroundColor: user.is_active ? '#EF4444' : ACCENT }}
        >
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>
            {user.is_active ? 'Suspend Account' : 'Restore Account'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
