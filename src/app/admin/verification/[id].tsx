import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Platform, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchVerificationProfile, resolveVerification, VerificationProfile } from '../../../controllers/adminController';

const ACCENT = '#FEA405';

export default function VerificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<VerificationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [modal, setModal] = useState<{ visible: boolean; type: 'approve' | 'reject' | null }>({ visible: false, type: null });

  useEffect(() => {
    fetchVerificationProfile(id!).then(result => {
      if (result.success && result.data) setProfile(result.data);
      setLoading(false);
    });
  }, [id]);

  const handleConfirm = async () => {
    const approved = modal.type === 'approve';
    setModal({ visible: false, type: null });
    setActing(true);
    await resolveVerification(id!, approved);
    setActing(false);
    router.back();
  };

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' }}>
      <Text className="text-gray-400 text-sm">Loading...</Text>
    </View>
  );

  if (!profile) return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' }}>
      <Text className="text-gray-400 text-sm">User not found</Text>
    </View>
  );

  const fullName = [profile.first_name, profile.middle_name, profile.last_name, profile.suffix].filter(Boolean).join(' ') || '—';
  const address = [profile.address_barangay, profile.address_city, profile.address_province].filter(Boolean).join(', ') || '—';

  const InfoRow = ({ label, value }: { label: string; value: string | null }) => (
    <View className="flex-row justify-between py-2 border-b border-gray-50">
      <Text className="text-xs text-gray-400">{label}</Text>
      <Text className="text-xs text-gray-800 font-medium">{value || '—'}</Text>
    </View>
  );

  const ImagePair = ({ label, frontUrl, backUrl }: { label: string; frontUrl: string | null; backUrl: string | null }) => (
    <View className="mt-4">
      <Text className="text-sm font-semibold text-gray-700 mb-2">{label}</Text>
      <View className="flex-row gap-3">
        {[{ side: 'Front', url: frontUrl }, { side: 'Back', url: backUrl }].map(({ side, url }) => (
          <View key={side} className="flex-1">
            <Text className="text-xs text-gray-400 mb-1">{side}</Text>
            {url ? (
              <Image source={{ uri: url }} style={{ width: '100%', height: 130, borderRadius: 12 }} resizeMode="cover" />
            ) : (
              <View style={{ height: 130 }} className="bg-gray-100 rounded-xl items-center justify-center">
                <Ionicons name="image-outline" size={24} color="#D1D5DB" />
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <Modal visible={modal.visible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
              {modal.type === 'approve' ? 'Approve Verification' : 'Reject Verification'}
            </Text>
            <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>
              {modal.type === 'approve'
                ? "Are you sure you want to approve this user's verification?"
                : "Are you sure you want to reject this user's verification?"}
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
                style={{ flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: modal.type === 'approve' ? ACCENT : '#EF4444' }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: 'white' }}>
                  {modal.type === 'approve' ? 'Approve' : 'Reject'}
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
        <Text className="text-lg font-bold text-gray-900">Verification Request</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
        <View className="bg-white rounded-2xl p-4 border border-gray-100">
          <Text className="text-sm font-bold text-gray-700 mb-2">Personal Information</Text>
          <InfoRow label="Full Name" value={fullName} />
          <InfoRow label="Gender" value={profile.gender} />
          <InfoRow label="Date of Birth" value={profile.date_of_birth} />
          <InfoRow label="Address" value={address} />
        </View>

        <View className="bg-white rounded-2xl p-4 border border-gray-100">
          <Text className="text-sm font-bold text-gray-700 mb-1">ID Documents</Text>
          <Text className="text-xs text-gray-400 mb-2">{profile.id_type || 'No ID type specified'}</Text>
          <ImagePair label="Government ID" frontUrl={profile.id_front_url} backUrl={profile.id_back_url} />
          <ImagePair label={`Utility Bill${profile.utility_bill_type ? ` (${profile.utility_bill_type})` : ''}`} frontUrl={profile.utility_bill_front_url} backUrl={profile.utility_bill_back_url} />
        </View>
      </ScrollView>

      <View className="bg-white border-t border-gray-100 px-4 py-4 flex-row gap-3">
        <TouchableOpacity
          onPress={() => setModal({ visible: true, type: 'reject' })}
          disabled={acting}
          activeOpacity={0.85}
          className="flex-1 border-2 border-red-400 rounded-2xl py-3 items-center"
        >
          <Text className="text-red-500 font-bold text-sm">Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setModal({ visible: true, type: 'approve' })}
          disabled={acting}
          activeOpacity={0.85}
          style={{ backgroundColor: ACCENT }}
          className="flex-1 rounded-2xl py-3 items-center"
        >
          <Text className="text-white font-bold text-sm">Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
