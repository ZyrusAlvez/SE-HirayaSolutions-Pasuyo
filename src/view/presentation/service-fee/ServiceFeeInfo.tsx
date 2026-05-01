import { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GCASH_LOGO = require('@/assets/images/gcash-logo.png');

export default function ServiceFeeInfo() {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={{ backgroundColor: 'white', borderRadius: 14, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setExpanded(v => !v)}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>About Service Fee</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#9CA3AF" />
      </TouchableOpacity>

      {expanded && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 14 }}>
          <View style={{ height: 1, backgroundColor: '#F3F4F6' }} />

          {/* What & Why */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>What is the Service Fee?</Text>
            <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 18 }}>
              The Service Fee is a 10% charge from each completed task. This helps maintain and improve the platform.
            </Text>
            <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 18 }}>
              After completing tasks, workers are required to pay the accumulated service fees to continue using the platform.
            </Text>
          </View>

          {/* Limits */}
          <View style={{ backgroundColor: '#FEF3C7', borderRadius: 10, padding: 12, gap: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#92400E' }}>Unpaid Service Fee Limits</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#D97706' }} />
              <Text style={{ fontSize: 12, color: '#92400E' }}>₱1,000 limit for non-verified users</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#D97706' }} />
              <Text style={{ fontSize: 12, color: '#92400E' }}>₱5,000 limit for verified users</Text>
            </View>
            <Text style={{ fontSize: 11, color: '#B45309', lineHeight: 16, marginTop: 2 }}>
              If your total unpaid service fee reaches the limit, you will not be able to accept new tasks until payment is made.
            </Text>
          </View>

          {/* Payment Method */}
          <View style={{ backgroundColor: '#F0F9FF', borderRadius: 10, padding: 12, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#1E40AF' }}>Payment Method</Text>
              <Image source={GCASH_LOGO} style={{ width: 60, height: 20 }} resizeMode="contain" />
            </View>
            <Text style={{ fontSize: 12, color: '#1E40AF' }}>Send the total service fee to:</Text>
            <View style={{ backgroundColor: 'white', borderRadius: 8, padding: 10, gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>GCash Number: 09936628701</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>Account Name: Zyrus Alvez</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="receipt-outline" size={14} color="#1E40AF" />
              <Text style={{ fontSize: 11, color: '#1E40AF' }}>Please keep your receipt after payment for verification.</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
