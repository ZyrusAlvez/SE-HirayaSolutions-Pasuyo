import { useState, useCallback } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getDashboardErrands } from '@/controllers/errandController';
import type { DashboardErrand } from '@/controllers/errandController';
import { useProfile } from '@/context/ProfileContext';
import Header from '@/view/components/Header';
import NavBar from '@/view/components/NavBar';
import TabToggle from '@/view/components/TabToggle';
import LoadingSpinner from '@/view/components/LoadingSpinner';
import ErrandList from '@/view/presentation/dashboard/ErrandList';

const TABS = [
  { key: 'posted', label: 'Posted Errands', icon: 'paper-plane-outline' },
  { key: 'accepted', label: 'Accepted Errands', icon: 'checkmark-circle-outline' },
];

export default function DashboardScreen() {
  const { avatarUrl, verificationStatus } = useProfile();
  const [tab, setTab] = useState('posted');
  const [posted, setPosted] = useState<DashboardErrand[]>([]);
  const [accepted, setAccepted] = useState<DashboardErrand[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    getDashboardErrands().then((result) => {
      if (result.success) {
        setPosted(result.data.posted);
        setAccepted(result.data.accepted);
      }
      setLoading(false);
    });
  }, []));

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <Header avatarUrl={avatarUrl} verificationStatus={verificationStatus} />
      <TabToggle tabs={TABS} activeKey={tab} onTabChange={setTab} />
      {loading ? (
        <LoadingSpinner />
      ) : tab === 'posted' ? (
        <ErrandList errands={posted} emptyText="You haven't posted any errands yet." />
      ) : (
        <ErrandList errands={accepted} emptyText="You haven't accepted any errands yet." />
      )}
      <NavBar />
    </View>
  );
}
