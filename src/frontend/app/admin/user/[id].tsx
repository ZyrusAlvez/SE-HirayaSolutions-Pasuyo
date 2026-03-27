import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Platform, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase, supabaseAdmin } from '../../../lib/supabase';

const ACCENT = '#FEA405';
const DEFAULT_AVATAR = require('../../../assets/images/default_profile.jpg');

interface UserDetail {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  verified: boolean;
  role: string | null;
  rating: number | null;
  created_at: string;
  is_active: boolean;
}

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [modal, setModal] = useState<{ visible: boolean; type: 'suspend' | 'restore' | null }>({ visible: false, type: null });

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    
    supabaseAdmin
      .from('admin_user_profiles')
      .select('id, display_name, email, avatar_url, verified, role, rating, created_at')
      .eq('id', id)
      .single()
      .then(async ({ data, error }) => {
        if (error) {
          console.error('Error fetching user:', error);
          setLoading(false);
          return;
        }
        
        const { data: profileData } = await supabaseAdmin
          .from('profiles')
          .select('is_active')
          .eq('id', id)
          .maybeSingle();
        
        setUser(data ? { ...data, is_active: profileData?.is_active ?? true } : null);
        setLoading(false);
      });
  }, [id]);

  const logAction = async (action: string) => {
    const { data: { user: admin } } = await supabase.auth.getUser();
    await supabaseAdmin.from('admin_logs').insert({
      admin_id: admin?.id,
      action,
      target_user_id: id,
      details: `Admin ${action.toLowerCase()} user ${id}`,
    });
  };

  const handleConfirm = async () => {
    const suspending = modal.type === 'suspend';
    setModal({ visible: false, type: null });
    setActing(true);

    await supabaseAdmin.from('profiles').update({ is_active: !suspending }).eq('id', id);

    if (suspending) {
      await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: '876600h' });
    } else {
      await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: 'none' });
    }

    await logAction(suspending ? 'SUSPENDED_USER' : 'RESTORED_USER');
    setUser(prev => prev ? { ...prev, is_active: !suspending } : prev);
    setActing(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' }}>
        <Text className="text-gray-400 text-sm">Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' }}>
        <Text className="text-gray-400 text-sm">User not found</Text>
      </View>
    );
  }

  const joinedDate = new Date(user.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View className="flex-row justify-between py-2 border-b border-gray-50">
      <Text className="text-xs text-gray-400">{label}</Text>
      <Text className="text-xs text-gray-800 font-medium">{value}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Confirm Modal */}
      <Modal visible={modal.visible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
              {modal.type === 'suspend' ? 'Suspend Account' : 'Restore Account'}
            </Text>
            <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>
              {modal.type === 'suspend'
                ? 'This will block the user from logging in. Are you sure?'
                : 'This will restore the user\'s access. Are you sure?'}
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

      {/* Header */}
      <View className={`bg-white border-b border-gray-100 ${Platform.OS !== 'web' ? 'pt-12' : 'pt-2'} pb-3 px-4 flex-row items-center gap-3`}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">User Detail</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
        {/* Avatar + name */}
        <View className="bg-white rounded-2xl p-4 border border-gray-100 items-center gap-2">
          <Image
            source={user.avatar_url ? { uri: user.avatar_url } : DEFAULT_AVATAR}
            style={{ width: 72, height: 72, borderRadius: 36 }}
            resizeMode="cover"
          />
          <Text className="text-base font-bold text-gray-900">{user.display_name || 'No name set'}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View className={`px-2 py-1 rounded-full ${user.verified ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Text className={`text-xs font-medium ${user.verified ? 'text-green-700' : 'text-gray-500'}`}>
                {user.verified ? 'Verified' : 'Unverified'}
              </Text>
            </View>
            <View className={`px-2 py-1 rounded-full ${user.is_active ? 'bg-blue-100' : 'bg-red-100'}`}>
              <Text className={`text-xs font-medium ${user.is_active ? 'text-blue-700' : 'text-red-500'}`}>
                {user.is_active ? 'Active' : 'Suspended'}
              </Text>
            </View>
          </View>
        </View>

        {/* Info */}
        <View className="bg-white rounded-2xl p-4 border border-gray-100">
          <Text className="text-sm font-bold text-gray-700 mb-2">Account Info</Text>
          <InfoRow label="Email" value={user.email ?? '—'} />
          <InfoRow label="Role" value={user.role ?? '—'} />
          <InfoRow label="Rating" value={user.rating != null ? `${user.rating}` : '—'} />
          <InfoRow label="Joined" value={joinedDate} />
        </View>
      </ScrollView>

      {/* Action button */}
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
