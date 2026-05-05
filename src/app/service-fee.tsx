import { useState, useCallback } from 'react';
import { View, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getUnpaidServiceFeeTotal, getUserPaymentHistory } from '@/controllers/serviceFeeController';
import type { ServiceFeePayment } from '@/controllers/serviceFeeController';
import { useProfile } from '@/context/ProfileContext';
import Header from '@/view/components/Header';
import NavBar from '@/view/components/NavBar';
import LoadingSpinner from '@/view/components/LoadingSpinner';
import ServiceFeeList from '@/view/presentation/service-fee/ServiceFeeList';

export default function ServiceFeeScreen() {
  const { avatarUrl, verificationStatus } = useProfile();
  const [loading, setLoading] = useState(true);
  const [unpaidTotal, setUnpaidTotal] = useState(0);
  const [payments, setPayments] = useState<ServiceFeePayment[]>([]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    Promise.all([
      getUnpaidServiceFeeTotal(),
      getUserPaymentHistory(),
    ]).then(([totalResult, paymentsResult]) => {
      if (totalResult.success) setUnpaidTotal(totalResult.data);
      if (paymentsResult.success) setPayments(paymentsResult.data);
      setLoading(false);
    });
  }, []));

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <Header avatarUrl={avatarUrl} verificationStatus={verificationStatus} />
      <View style={[{ flex: 1 }, Platform.OS === 'web' && { maxWidth: 1200, width: '100%', alignSelf: 'center' as const }]}>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <ServiceFeeList isVerified={verificationStatus === 'verified'} unpaidTotal={unpaidTotal} payments={payments} />
        )}
      </View>
      <NavBar />
    </View>
  );
}
