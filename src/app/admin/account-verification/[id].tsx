import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Platform, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getVerificationProfile, updateVerificationStatus } from '@/controllers/adminController';
import type { VerificationProfile } from '@/controllers/adminController';
import ImageViewer from '@/view/components/ImageViewer';
import { toast } from '@/utils/toast';

const ACCENT = '#FEA405';

export default function VerificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<VerificationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [modal, setModal] = useState<{ visible: boolean; type: 'approve' | 'reject' | null }>({ visible: false, type: null });
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    getVerificationProfile(id!).then(result => {
      if (result.success && result.data) setProfile(result.data);
      setLoading(false);
    });
  }, [id]);

  const handleConfirm = async () => {
    const approved = modal.type === 'approve';
    setModal({ visible: false, type: null });
    setActing(true);
    const result = await updateVerificationStatus(id!, approved);
    setActing(false);
    if (!result.success) { toast({ title: result.error, preset: 'error' }); return; }
    toast({ title: approved ? 'Verification approved.' : 'Verification rejected.', preset: 'done' });
    router.back();
  };

  if (loading) return (
    <View style={[{ flex: 1, backgroundColor: '#F9FAFB' }, Platform.OS === 'web' && { maxWidth: 1000, width: '100%', alignSelf: 'center' as const }]}>
      <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingTop: Platform.OS !== 'web' ? 48 : 8, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>Verification Request</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, gap: 10 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
              <View style={{ width: 80, height: 12, borderRadius: 6, backgroundColor: '#E5E7EB' }} />
              <View style={{ width: 120, height: 12, borderRadius: 6, backgroundColor: '#E5E7EB' }} />
            </View>
          ))}
        </View>
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, gap: 10 }}>
          {[1, 2, 3].map(i => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
              <View style={{ width: 100, height: 12, borderRadius: 6, backgroundColor: '#E5E7EB' }} />
              <View style={{ width: 140, height: 12, borderRadius: 6, backgroundColor: '#E5E7EB' }} />
            </View>
          ))}
        </View>
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, gap: 10 }}>
          <View style={{ width: 100, height: 14, borderRadius: 6, backgroundColor: '#E5E7EB' }} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, height: 130, borderRadius: 12, backgroundColor: '#E5E7EB' }} />
            <View style={{ flex: 1, height: 130, borderRadius: 12, backgroundColor: '#E5E7EB' }} />
          </View>
        </View>
      </ScrollView>
    </View>
  );

  if (!profile) return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="alert-circle-outline" size={48} color="#E5E7EB" />
      <Text style={{ color: '#9CA3AF', marginTop: 8 }}>User not found</Text>
    </View>
  );

  const fullName = [profile.first_name, profile.middle_name, profile.last_name, profile.suffix].filter(Boolean).join(' ') || '—';
  const address = [
    profile.address_house_no,
    profile.address_building,
    profile.address_unit && `Unit ${profile.address_unit}`,
    profile.address_floor && `Floor ${profile.address_floor}`,
    profile.address_block_lot,
    profile.address_phase_subdivision,
    profile.address_street,
    profile.address_barangay,
    profile.address_city,
    profile.address_province,
  ].filter(Boolean).join(', ') || '—';

  const docImages: { uri: string; fileName: string }[] = [];
  if (profile.id_front_url) docImages.push({ uri: profile.id_front_url, fileName: 'ID Front' });
  if (profile.id_back_url) docImages.push({ uri: profile.id_back_url, fileName: 'ID Back' });
  if (profile.utility_bill_front_url) docImages.push({ uri: profile.utility_bill_front_url, fileName: 'Bill Front' });
  if (profile.utility_bill_back_url) docImages.push({ uri: profile.utility_bill_back_url, fileName: 'Bill Back' });

  const submittedAt = profile.verification_submitted_at
    ? new Date(profile.verification_submitted_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—';

  return (
    <View style={[{ flex: 1, backgroundColor: '#F9FAFB' }, Platform.OS === 'web' && { maxWidth: 1000, width: '100%', alignSelf: 'center' as const }]}>
      <Modal visible={modal.visible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
              {modal.type === 'approve' ? 'Approve Verification' : 'Reject Verification'}
            </Text>
            <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>
              {modal.type === 'approve'
                ? `Are you sure you want to approve ${fullName}'s verification?`
                : `Are you sure you want to reject ${fullName}'s verification?`}
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

      <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingTop: Platform.OS !== 'web' ? 48 : 8, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>Verification Request</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
        {/* Personal Information */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 }}>Personal Information</Text>
          <InfoRow label="Full Name" value={fullName} />
          <InfoRow label="First Name" value={profile.first_name} />
          {profile.middle_name && <InfoRow label="Middle Name" value={profile.middle_name} />}
          <InfoRow label="Last Name" value={profile.last_name} />
          {profile.suffix && <InfoRow label="Suffix" value={profile.suffix} />}
          <InfoRow label="Gender" value={profile.gender} />
          <InfoRow label="Date of Birth" value={profile.date_of_birth} />
        </View>

        {/* Address */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 }}>Address</Text>
          <InfoRow label="Full Address" value={address} />
          {profile.address_type && <InfoRow label="Address Type" value={profile.address_type} />}
          <InfoRow label="Province" value={profile.address_province} />
          <InfoRow label="City" value={profile.address_city} />
          <InfoRow label="Barangay" value={profile.address_barangay} />
          {profile.address_street && <InfoRow label="Street" value={profile.address_street} />}
          {profile.address_house_no && <InfoRow label="House No." value={profile.address_house_no} />}
          {profile.address_building && <InfoRow label="Building" value={profile.address_building} />}
          {profile.address_unit && <InfoRow label="Unit" value={profile.address_unit} />}
          {profile.address_floor && <InfoRow label="Floor" value={profile.address_floor} />}
          {profile.address_block_lot && <InfoRow label="Block/Lot" value={profile.address_block_lot} />}
          {profile.address_phase_subdivision && <InfoRow label="Phase/Subdivision" value={profile.address_phase_subdivision} />}
        </View>

        {/* Documents */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 4 }}>ID Documents</Text>
          <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12 }}>{profile.id_type || 'No ID type specified'}</Text>

          <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Government ID</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            <DocImage label="Front" url={profile.id_front_url} onPress={() => { if (profile.id_front_url) setViewerIndex(docImages.findIndex(d => d.uri === profile.id_front_url)); }} />
            <DocImage label="Back" url={profile.id_back_url} onPress={() => { if (profile.id_back_url) setViewerIndex(docImages.findIndex(d => d.uri === profile.id_back_url)); }} />
          </View>

          {(profile.utility_bill_front_url || profile.utility_bill_back_url) && (
            <>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                Utility Bill{profile.utility_bill_type ? ` (${profile.utility_bill_type})` : ''}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <DocImage label="Front" url={profile.utility_bill_front_url} onPress={() => { if (profile.utility_bill_front_url) setViewerIndex(docImages.findIndex(d => d.uri === profile.utility_bill_front_url)); }} />
                <DocImage label="Back" url={profile.utility_bill_back_url} onPress={() => { if (profile.utility_bill_back_url) setViewerIndex(docImages.findIndex(d => d.uri === profile.utility_bill_back_url)); }} />
              </View>
            </>
          )}
        </View>

        {/* Submission Info */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 }}>Submission Details</Text>
          <InfoRow label="Submitted At" value={submittedAt} />
          <InfoRow label="Account Created" value={new Date(profile.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })} />
        </View>
        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
          <TouchableOpacity
            onPress={() => setModal({ visible: true, type: 'reject' })}
            disabled={acting}
            activeOpacity={0.85}
            style={{ borderWidth: 1.5, borderColor: '#EF4444', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16 }}
          >
            <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 13 }}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setModal({ visible: true, type: 'approve' })}
            disabled={acting}
            activeOpacity={0.85}
            style={{ backgroundColor: ACCENT, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16 }}
          >
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Approve</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ImageViewer
        images={docImages}
        activeIndex={viewerIndex}
        onClose={() => setViewerIndex(null)}
        onIndexChange={setViewerIndex}
      />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' }}>
      <Text style={{ fontSize: 12, color: '#9CA3AF', minWidth: 110 }}>{label}</Text>
      <Text style={{ fontSize: 12, color: '#1F2937', fontWeight: '500', textAlign: 'right', flex: 1, marginLeft: 12 }}>{value || '—'}</Text>
    </View>
  );
}

function DocImage({ label, url, onPress }: { label: string; url: string | null; onPress: () => void }) {
  return (
    <View>
      <Text style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>{label}</Text>
      {url ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
          <Image source={{ uri: url }} style={{ width: 100, height: 70, borderRadius: 8, backgroundColor: '#F3F4F6' }} resizeMode="cover" />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 100, height: 70, backgroundColor: '#F3F4F6', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="image-outline" size={18} color="#D1D5DB" />
        </View>
      )}
    </View>
  );
}
