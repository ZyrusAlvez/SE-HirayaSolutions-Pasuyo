import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { ServiceFeePayment } from '@/controllers/serviceFeeController';
import ImageViewer from '@/view/components/ImageViewer';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#F59E0B', bg: '#FFFBEB' },
  approved: { label: 'Approved', color: '#10B981', bg: '#F0FDF4' },
  rejected: { label: 'Rejected', color: '#EF4444', bg: '#FEF2F2' },
};

function PaymentCard({ payment }: { payment: ServiceFeePayment }) {
  const [expanded, setExpanded] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const config = STATUS_CONFIG[payment.status];
  const date = new Date(payment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = new Date(payment.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <View style={{ backgroundColor: 'white', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 }}>
      {/* Header */}
      <TouchableOpacity activeOpacity={0.7} onPress={() => setExpanded(v => !v)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>₱{Number(payment.amount).toLocaleString()}</Text>
          <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{date} · {time}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ backgroundColor: config.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: config.color }}>{config.label}</Text>
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#9CA3AF" />
        </View>
      </TouchableOpacity>

      {/* Details */}
      {expanded && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 11, color: '#6B7280' }}>Amount</Text>
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#111827' }}>₱{Number(payment.amount).toLocaleString()}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 11, color: '#6B7280' }}>Reference No.</Text>
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#111827' }}>{payment.reference_no}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 11, color: '#6B7280' }}>Submitted</Text>
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#111827' }}>{date} · {time}</Text>
          </View>

          {payment.reviewed_at ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 11, color: '#6B7280' }}>Reviewed</Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#111827' }}>
                {new Date(payment.reviewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {new Date(payment.reviewed_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </Text>
            </View>
          ) : null}

          {payment.admin_note ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 11, color: '#6B7280' }}>Note</Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#111827', flex: 1, textAlign: 'right', marginLeft: 12 }}>{payment.admin_note}</Text>
            </View>
          ) : null}

          {payment.screenshot_url ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: '#6B7280' }}>Receipt</Text>
              <TouchableOpacity activeOpacity={0.8} onPress={() => setViewerOpen(true)}>
                <Image source={{ uri: payment.screenshot_url }} style={{ width: 48, height: 48, borderRadius: 6 }} resizeMode="cover" />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      )}

      {payment.screenshot_url ? (
        <ImageViewer
          images={[payment.screenshot_url]}
          activeIndex={viewerOpen ? 0 : null}
          onClose={() => setViewerOpen(false)}
          onIndexChange={() => {}}
        />
      ) : null}
    </View>
  );
}

interface Props {
  payments: ServiceFeePayment[];
}

export default function PaymentHistory({ payments }: Props) {
  if (payments.length === 0) return null;

  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>Payment History</Text>
      {payments.map(p => <PaymentCard key={p.id} payment={p} />)}
    </View>
  );
}
