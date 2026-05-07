import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LIMIT_NON_VERIFIED = 1000;
const LIMIT_VERIFIED = 5000;

interface Props {
  totalFees: number;
  isVerified: boolean;
  isAdmin?: boolean;
}

export default function ServiceFeeLimitBar({ totalFees, isVerified, isAdmin }: Props) {
  const limit = isVerified ? LIMIT_VERIFIED : LIMIT_NON_VERIFIED;
  const ratio = Math.min(totalFees / limit, 1);
  const percentage = Math.round(ratio * 100);
  const remaining = Math.max(limit - totalFees, 0);

  const barColor = ratio >= 1 ? '#EF4444' : ratio >= 0.75 ? '#F59E0B' : '#10B981';
  const bgTint = ratio >= 1 ? '#FEF2F2' : ratio >= 0.75 ? '#FFFBEB' : '#F0FDF4';
  const textColor = ratio >= 1 ? '#991B1B' : ratio >= 0.75 ? '#92400E' : '#065F46';

  return (
    <View style={{ backgroundColor: 'white', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="speedometer-outline" size={16} color={barColor} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }}>Service Fee Limit</Text>
        </View>
        <View style={{ backgroundColor: isVerified ? '#DBEAFE' : '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
          <Text style={{ fontSize: 10, fontWeight: '600', color: isVerified ? '#1E40AF' : '#6B7280' }}>
            {isVerified ? 'Verified' : 'Non-verified'}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={{ height: 10, backgroundColor: '#F3F4F6', borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
        <View style={{ height: '100%', width: `${percentage}%`, backgroundColor: barColor, borderRadius: 5 }} />
      </View>

      {/* Labels */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ fontSize: 11, color: '#6B7280' }}>₱{totalFees.toLocaleString()} used</Text>
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#374151' }}>₱{limit.toLocaleString()} limit</Text>
      </View>

      {/* Status message */}
      <View style={{ backgroundColor: bgTint, borderRadius: 8, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons
          name={ratio >= 1 ? 'alert-circle' : ratio >= 0.75 ? 'warning' : 'checkmark-circle'}
          size={16}
          color={barColor}
        />
        <Text style={{ fontSize: 11, color: textColor, flex: 1, lineHeight: 16 }}>
          {ratio >= 1
            ? isAdmin ? 'User has reached their limit.' : 'You have reached your limit. Pay your service fees to accept new errands.'
            : `₱${remaining.toLocaleString()} remaining before ${isAdmin ? 'user reaches their' : 'you reach your'} limit.`}
        </Text>
      </View>
    </View>
  );
}
