import { useState, useCallback } from 'react';
import { View, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getServiceFeeErrands, getUnpaidServiceFeeTotal } from '@/controllers/serviceFeeController';
import type { ServiceFeeErrand } from '@/controllers/serviceFeeController';
import { useProfile } from '@/context/ProfileContext';
import Header from '@/view/components/Header';
import NavBar from '@/view/components/NavBar';
import LoadingSpinner from '@/view/components/LoadingSpinner';
import ServiceFeeList from '@/view/presentation/service-fee/ServiceFeeList';

export default function ServiceFeeScreen() {
  const { avatarUrl, verificationStatus } = useProfile();
  const [errands, setErrands] = useState<ServiceFeeErrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [unpaidTotal, setUnpaidTotal] = useState(0);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    Promise.all([
      getServiceFeeErrands(),
      getUnpaidServiceFeeTotal(),
    ]).then(([errandsResult, totalResult]) => {
      if (errandsResult.success) setErrands(errandsResult.data);
      if (totalResult.success) setUnpaidTotal(totalResult.data);
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
          <ServiceFeeList errands={errands} emptyText="No unpaid service fees." isVerified={verificationStatus === 'verified'} unpaidTotal={unpaidTotal} />
        )}
      </View>
      <NavBar />
    </View>
  );
}
