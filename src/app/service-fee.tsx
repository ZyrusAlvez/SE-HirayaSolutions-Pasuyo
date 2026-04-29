import { useState, useCallback } from 'react';
import { View, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getServiceFeeErrands } from '@/controllers/serviceFeeController';
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

  useFocusEffect(useCallback(() => {
    setLoading(true);
    getServiceFeeErrands().then((result) => {
      if (result.success) setErrands(result.data);
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
          <ServiceFeeList errands={errands} emptyText="No unpaid service fees." />
        )}
      </View>
      <NavBar />
    </View>
  );
}
