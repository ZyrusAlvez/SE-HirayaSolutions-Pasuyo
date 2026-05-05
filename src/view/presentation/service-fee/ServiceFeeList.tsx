import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ServiceFeeErrand } from '@/controllers/serviceFeeController';
import ServiceFeeInfo from './ServiceFeeInfo';
import ServiceFeeLimitBar from './ServiceFeeLimitBar';

interface Props {
  errands: ServiceFeeErrand[];
  emptyText: string;
  isVerified: boolean;
}

export default function ServiceFeeList({ errands, emptyText, isVerified }: Props) {
  const router = useRouter();
  const totalFees = errands.reduce((sum, e) => sum + e.serviceFee, 0);

  return (
    <ScrollView showsVerticalScrollIndicator contentContainerStyle={{ padding: 20, paddingBottom: 32, maxWidth: 960, width: '100%', alignSelf: 'center' as const }}>
      <ServiceFeeInfo />

      <ServiceFeeLimitBar totalFees={totalFees} isVerified={isVerified} onPay={() => router.push('/pay-service-fee')} />

      {errands.length === 0 ? (
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 64 }}>
          <Ionicons name="document-text-outline" size={48} color="#E5E7EB" />
          <Text style={{ color: '#9CA3AF', marginTop: 8 }}>{emptyText}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
