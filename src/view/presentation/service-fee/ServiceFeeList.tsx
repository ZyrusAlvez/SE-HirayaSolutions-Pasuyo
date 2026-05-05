import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import ServiceFeeInfo from './ServiceFeeInfo';
import ServiceFeeLimitBar from './ServiceFeeLimitBar';

interface Props {
  isVerified: boolean;
  unpaidTotal: number;
}

export default function ServiceFeeList({ isVerified, unpaidTotal }: Props) {
  const router = useRouter();

  return (
    <ScrollView showsVerticalScrollIndicator contentContainerStyle={{ padding: 20, paddingBottom: 32, maxWidth: 960, width: '100%', alignSelf: 'center' as const }}>
      <ServiceFeeInfo />
      <ServiceFeeLimitBar totalFees={unpaidTotal} isVerified={isVerified} onPay={() => router.push('/pay-service-fee')} />
    </ScrollView>
  );
}
