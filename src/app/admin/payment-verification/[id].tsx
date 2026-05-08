import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Platform, Modal, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getPaymentDetail, updatePaymentStatus, getAdminUnpaidTotal } from '@/controllers/adminController';
import { PAYMENT_REJECTION_REASONS } from '@/controllers/reportController';
import ImageViewer from '@/view/components/ImageViewer';
import ServiceFeeLimitBar from '@/view/components/ServiceFeeLimitBar';
import { toast } from '@/utils/toast';

const ACCENT = '#FEA405';

export default function PaymentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [approveVisible, setApproveVisible] = useState(false);
  const [rejectVisible, setRejectVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState(PAYMENT_REJECTION_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [reviewerName, setReviewerName] = useState<string | null>(null);
  const [unpaidTotal, setUnpaidTotal] = useState<number | null>(null);
  const [userStatus, setUserStatus] = useState<string>('unverified');

  useEffect(() => {
    if (!id) return;
    getPaymentDetail(id).then(async result => {
      if (result.success) {
        setPayment(result.data);
        // Load service fee balance
        getAdminUnpaidTotal(result.data.user_id).then(r => {
          if (r.success) setUnpaidTotal(r.data);
        });
        // Load user verification status
        const { getProfileNames } = await import('@/models/adminModel');
        const { data: profiles } = await getProfileNames([result.data.user_id]);
        // Check status from profiles table
        const { getUserDetail } = await import('@/models/adminModel');
        const { data: userProfile } = await getUserDetail(result.data.user_id);
        if (userProfile?.status) setUserStatus(userProfile.status);
        // Get reviewer name if reviewed
        if (result.data.reviewed_by) {
          const { getUserEmail } = await import('@/models/adminModel');
          const { data: rProfiles } = await getProfileNames([result.data.reviewed_by]);
          const rp = (rProfiles ?? [])[0];
          const name = rp ? [rp.first_name, rp.last_name].filter(Boolean).join(' ') : '';
          if (name) { setReviewerName(name); }
          else {
            const { data: auth } = await getUserEmail(result.data.reviewed_by);
            setReviewerName(auth?.displayName || 'Admin');
          }
        }
      }
      setLoading(false);
    });
  }, [id]);

  const handleApprove = async () => {
    setApproveVisible(false);
    setActing(true);
    const result = await updatePaymentStatus(id!, true);
    setActing(false);
    if (!result.success) { toast({ title: result.error, preset: 'error' }); return; }
    toast({ title: 'Payment approved.', preset: 'done' });
    router.back();
  };

  const handleReject = async () => {
    const reason = selectedReason === 'Other' ? customReason.trim() : selectedReason;
    if (!reason) return;
    setRejectVisible(false);
    setActing(true);
    const result = await updatePaymentStatus(id!, false, reason);
    setActing(false);
    if (!result.success) { toast({ title: result.error, preset: 'error' }); return; }
    toast({ title: 'Payment rejected.', preset: 'done' });
    router.back();
  };

  const images = payment?.screenshot_url ? [{ uri: payment.screenshot_url, fileName: 'Receipt' }] : [];

  if (loading) return (
    <View style={[{ flex: 1, backgroundColor: '#F9FAFB' }, Platform.OS === 'web' && { maxWidth: 1000, width: '100%', alignSelf: 'center' as const }]}>
      <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingTop: Platform.OS !== 'web' ? 48 : 8, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>Payment Verification</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, gap: 10 }}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
              <View style={{ width: 80, height: 12, borderRadius: 6, backgroundColor: '#E5E7EB' }} />
              <View style={{ width: 120, height: 12, borderRadius: 6, backgroundColor: '#E5E7EB' }} />
            </View>
          ))}
        </View>
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, gap: 10 }}>
          <View style={{ width: 100, height: 14, borderRadius: 6, backgroundColor: '#E5E7EB' }} />
          <View style={{ width: 100, height: 70, borderRadius: 8, backgroundColor: '#E5E7EB' }} />
        </View>
      </ScrollView>
    </View>
  );

  if (!payment) return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="alert-circle-outline" size={48} color="#E5E7EB" />
      <Text style={{ color: '#9CA3AF', marginTop: 8 }}>Payment not found</Text>
    </View>
  );

  return (
    <View style={[{ flex: 1, backgroundColor: '#F9FAFB' }, Platform.OS === 'web' && { maxWidth: 1000, width: '100%', alignSelf: 'center' as const }]}>
      {/* Approve Modal */}
      <Modal visible={approveVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 }}>Approve Payment</Text>
            <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>
              Approve ₱{payment.amount.toLocaleString()} payment from {payment.user_name}?
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setApproveVisible(false)} activeOpacity={0.8} style={{ flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleApprove} activeOpacity={0.8} style={{ flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: ACCENT }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: 'white' }}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal visible={rejectVisible} transparent animationType="fade" onRequestClose={() => setRejectVisible(false)}>
        <Pressable style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)', padding: 24 }} onPress={() => setRejectVisible(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 360, maxHeight: '80%' }}>
            <View style={{ padding: 24, paddingBottom: 0 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 }}>Reject Payment</Text>
              <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 19, marginBottom: 16 }}>
                Select a reason for rejecting this payment.
              </Text>
            </View>

            <ScrollView style={{ paddingHorizontal: 24 }} contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={true}>
              {PAYMENT_REJECTION_REASONS.map((reason) => (
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

            <View style={{ flexDirection: 'row', gap: 10, padding: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
              <TouchableOpacity onPress={() => setRejectVisible(false)} activeOpacity={0.7} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleReject} activeOpacity={0.7} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: (selectedReason === 'Other' && !customReason.trim()) ? '#FCA5A5' : '#EF4444', alignItems: 'center' }} disabled={selectedReason === 'Other' && !customReason.trim()}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Reject</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingTop: Platform.OS !== 'web' ? 48 : 8, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>Payment Verification</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
        {/* User Info */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 }}>Submitted By</Text>
          <TouchableOpacity onPress={() => router.push(`/admin/account/${payment.user_id}`)} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="person-circle-outline" size={24} color="#6B7280" />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>{payment.user_name}</Text>
            <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
          </TouchableOpacity>
        </View>

        {/* Service Fee Limit */}
        {unpaidTotal != null && (
          <ServiceFeeLimitBar totalFees={unpaidTotal} isVerified={userStatus === 'verified'} isAdmin />
        )}

        {/* Payment Details */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 }}>Payment Details</Text>
          <InfoRow label="Amount" value={`₱${payment.amount.toLocaleString()}`} highlight />
          <InfoRow label="Reference No." value={payment.reference_no} />
          <InfoRow label="Submitted" value={new Date(payment.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })} />
          <InfoRow label="Status" value={payment.status.charAt(0).toUpperCase() + payment.status.slice(1)} />
        </View>

        {/* Receipt */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 }}>Receipt Screenshot</Text>
          {payment.screenshot_url ? (
            <TouchableOpacity onPress={() => setViewerIndex(0)} activeOpacity={0.8}>
              <Image source={{ uri: payment.screenshot_url }} style={{ width: 100, height: 70, borderRadius: 8, backgroundColor: '#F3F4F6' }} resizeMode="cover" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 100, height: 70, backgroundColor: '#F3F4F6', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="image-outline" size={18} color="#D1D5DB" />
            </View>
          )}
        </View>

        {/* Review Info (for already reviewed) */}
        {payment.status !== 'pending' && (
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 }}>Review Details</Text>
            <InfoRow label="Decision" value={payment.status.charAt(0).toUpperCase() + payment.status.slice(1)} highlight color={payment.status === 'approved' ? '#22C55E' : '#EF4444'} />
            {reviewerName && <InfoRow label="Reviewed By" value={reviewerName} />}
            {payment.reviewed_at && <InfoRow label="Reviewed At" value={new Date(payment.reviewed_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })} />}
            {payment.admin_note && <InfoRow label="Reason" value={payment.admin_note} />}
          </View>
        )}

        {/* Action Buttons (only for pending) */}
        {payment.status === 'pending' && (
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <TouchableOpacity
              onPress={() => setRejectVisible(true)}
              disabled={acting}
              activeOpacity={0.85}
              style={{ borderWidth: 1.5, borderColor: '#EF4444', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16 }}
            >
              <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 13 }}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setApproveVisible(true)}
              disabled={acting}
              activeOpacity={0.85}
              style={{ backgroundColor: ACCENT, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16 }}
            >
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <ImageViewer
        images={images}
        activeIndex={viewerIndex}
        onClose={() => setViewerIndex(null)}
        onIndexChange={setViewerIndex}
      />

      {acting && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      )}
    </View>
  );
}

function InfoRow({ label, value, highlight, color }: { label: string; value: string; highlight?: boolean; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' }}>
      <Text style={{ fontSize: 12, color: '#9CA3AF', minWidth: 110 }}>{label}</Text>
      <Text style={{ fontSize: 12, color: highlight ? (color ?? '#D97706') : '#1F2937', fontWeight: highlight ? '700' : '500', textAlign: 'right', flex: 1, marginLeft: 12 }}>{value}</Text>
    </View>
  );
}
