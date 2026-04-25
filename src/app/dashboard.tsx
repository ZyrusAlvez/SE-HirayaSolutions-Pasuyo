import { useState, useCallback, useMemo } from 'react';
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
import SortFilterBar from '@/view/presentation/dashboard/SortFilterBar';

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
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

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

  const POSTED_STATUSES = ['Available', 'In Progress', 'Completed', 'Expired'];
  const ACCEPTED_STATUSES = ['Available', 'In Progress', 'Completed', 'Expired', 'Cancelled'];
  const filterOptions = tab === 'posted' ? POSTED_STATUSES : ACCEPTED_STATUSES;

  const filteredErrands = useMemo(() => {
    let source = tab === 'posted' ? posted : accepted;
    if (statusFilter) source = source.filter(e => e.status === statusFilter);
    if (typeFilter) source = source.filter(e => typeFilter === 'Remote' ? e.is_remote : !e.is_remote);
    return source;
  }, [tab, posted, accepted, statusFilter, typeFilter]);

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
        <View style={{ paddingVertical: 8, zIndex: 10 }}>
          <SortFilterBar statusOptions={filterOptions} statusFilter={statusFilter} onStatusChange={setStatusFilter} typeFilter={typeFilter} onTypeChange={setTypeFilter} />
        </View>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <ErrandList
            errands={filteredErrands}
            emptyText={(statusFilter || typeFilter) ? 'No errands match the selected filters.' : (tab === 'posted' ? "You haven't posted any errands yet." : "You haven't accepted any errands yet.")}
            viewMode={viewMode}
          />
        )}
      </View>
      <NavBar />
    </View>
  );
}
