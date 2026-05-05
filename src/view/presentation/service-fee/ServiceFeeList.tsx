import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import type { ServiceFeePayment } from '@/controllers/serviceFeeController';
import ServiceFeeInfo from './ServiceFeeInfo';
import ServiceFeeLimitBar from './ServiceFeeLimitBar';
import PaymentHistory from './PaymentHistory';

interface Props {
  isVerified: boolean;
  unpaidTotal: number;
  payments: ServiceFeePayment[];
}

export default function ServiceFeeList({ isVerified, unpaidTotal, payments }: Props) {
  const router = useRouter();

  return (
    <ScrollView showsVerticalScrollIndicator contentContainerStyle={{ padding: 20, paddingBottom: 32, maxWidth: 960, width: '100%', alignSelf: 'center' as const }}>
      <ServiceFeeInfo />
      <ServiceFeeLimitBar totalFees={unpaidTotal} isVerified={isVerified} onPay={() => router.push('/pay-service-fee')} />
      <PaymentHistory payments={payments} />
    </ScrollView>
  );
}
