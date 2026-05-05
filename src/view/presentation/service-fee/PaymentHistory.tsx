import { View, Text, Image, TouchableOpacity, Animated } from 'react-native';
import { useState, useRef, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { ServiceFeePayment } from '@/controllers/serviceFeeController';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#F59E0B', bg: '#FFFBEB' },
  approved: { label: 'Approved', color: '#10B981', bg: '#F0FDF4' },
  rejected: { label: 'Rejected', color: '#EF4444', bg: '#FEF2F2' },
};

function PaymentCard({ payment }: { payment: ServiceFeePayment }) {
  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;
  const config = STATUS_CONFIG[payment.status];
  const date = new Date(payment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = new Date(payment.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const toggle = () => {
    const toValue = expanded ? 0 : 1;
    setExpanded(!expanded);
    Animated.timing(anim, { toValue, duration: 250, useNativeDriver: false }).start();
  };

  const onLayout = useCallback((e: any) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && h !== contentHeight) setContentHeight(h);
  }, [contentHeight]);

  const animatedHeight = anim.interpolate({ inputRange: [0, 1], outputRange: [0, contentHeight || 200] });
  const animatedOpacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={toggle} style={{ backgroundColor: 'white', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
      </View>

      <Animated.View style={{ height: animatedHeight, opacity: animatedOpacity, overflow: 'hidden' }}>
        <View onLayout={onLayout} style={{ paddingTop: 12, marginTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 11, color: '#6B7280' }}>Reference No.</Text>
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#111827' }}>{payment.reference_no}</Text>
          </View>

          {payment.screenshot_url && (
            <Image source={{ uri: payment.screenshot_url }} style={{ width: '100%', height: 160, borderRadius: 8, marginTop: 4 }} resizeMode="cover" />
          )}

          {payment.status === 'rejected' && payment.admin_note && (
            <View style={{ backgroundColor: '#FEF2F2', borderRadius: 8, padding: 10, marginTop: 4 }}>
              <Text style={{ fontSize: 11, color: '#991B1B' }}>Reason: {payment.admin_note}</Text>
            </View>
          )}

          {payment.reviewed_at && (
            <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
              Reviewed {new Date(payment.reviewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
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
