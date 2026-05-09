import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import type { ServiceFeePayment } from '@/controllers/serviceFeeController';
import ServiceFeeLimitBar from '@/view/components/ServiceFeeLimitBar';
import PaymentHistory from './PaymentHistory';
import { LimitBarSkeleton, PaymentHistorySkeleton } from './SkeletonLoading';

interface Props {
  isVerified: boolean;
  unpaidTotal: number;
  payments: ServiceFeePayment[];
  loading: boolean;
}

export default function ServiceFeeList({ isVerified, unpaidTotal, payments, loading }: Props) {
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator contentContainerStyle={{ padding: 20, paddingBottom: 80, maxWidth: 560, width: '100%', alignSelf: 'center' as const }}>
        {/* Info button — top right */}
        <View style={{ alignItems: 'flex-end', marginBottom: 12 }}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/service-fee/about')} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#F3F4F6' }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B7280' }}>What is Service Fee?</Text>
          </TouchableOpacity>
        </View>

        {loading ? <LimitBarSkeleton /> : <ServiceFeeLimitBar totalFees={unpaidTotal} isVerified={isVerified} />}

        <View style={{ marginTop: 16 }}>
          {loading ? <PaymentHistorySkeleton /> : <PaymentHistory payments={payments} />}
        </View>
      </ScrollView>

      {/* Floating pay button — only show when loaded and has fees */}
      {!loading && unpaidTotal > 0 && (
        <View style={{ position: 'absolute', bottom: 20, left: 20, right: 20, alignItems: 'center' }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/pay-service-fee')}
            testID="pay-service-fee-btn"
            style={{ backgroundColor: '#34D399', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, width: '100%', maxWidth: 560, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Pay Service Fee</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
