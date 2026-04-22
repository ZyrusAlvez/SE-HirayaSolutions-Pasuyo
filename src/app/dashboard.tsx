import { useState, useCallback } from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDashboardErrands } from '@/controllers/errandController';
import type { DashboardErrand } from '@/controllers/errandController';
import { useProfile } from '@/context/ProfileContext';
import Header from '@/view/components/Header';
import NavBar from '@/view/components/NavBar';
import TabToggle from '@/view/components/TabToggle';
import LoadingSpinner from '@/view/components/LoadingSpinner';
import ErrandList from '@/view/presentation/dashboard/ErrandList';

const TABS = [
  { key: 'posted', label: 'My Posted Errands', icon: 'paper-plane-outline' },
  { key: 'accepted', label: 'My Accepted Errands', icon: 'checkmark-circle-outline' },
];

export default function DashboardScreen() {
  const { avatarUrl, verificationStatus } = useProfile();
  const [tab, setTab] = useState('posted');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
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
      <View style={[{ flex: 1 }, Platform.OS === 'web' && { maxWidth: 1200, width: '100%', alignSelf: 'center' as const }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <TabToggle tabs={TABS} activeKey={tab} onTabChange={setTab} />
          </View>
          <TouchableOpacity
            onPress={() => setViewMode(v => v === 'card' ? 'list' : 'card')}
            activeOpacity={0.7}
            style={{ marginRight: 24, marginTop: 8 }}
          >
            <Ionicons name={viewMode === 'card' ? 'list-outline' : 'grid-outline'} size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
        {loading ? (
          <LoadingSpinner />
        ) : tab === 'posted' ? (
          <ErrandList errands={posted} emptyText="You haven't posted any errands yet." viewMode={viewMode} />
        ) : (
          <ErrandList errands={accepted} emptyText="You haven't accepted any errands yet." viewMode={viewMode} />
        )}
      </View>
      <NavBar />
    </View>
  );
}
