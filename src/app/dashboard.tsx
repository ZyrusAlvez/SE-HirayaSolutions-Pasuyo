import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getDashboardErrands } from '@/controllers/errandController';
import type { DashboardErrand } from '@/controllers/errandController';
import { useProfile } from '@/context/ProfileContext';
import Header from '@/view/components/Header';
import NavBar from '@/view/components/NavBar';
import TabToggle from '@/view/components/TabToggle';
import LoadingSpinner from '@/view/components/LoadingSpinner';
import ErrandList from '@/view/presentation/dashboard/ErrandList';
import SearchBar from '@/view/components/SearchBar';
import SortFilterBar from '@/view/presentation/dashboard/SortFilterBar';
import type { SortState } from '@/view/presentation/dashboard/SortFilterBar';

const TABS = [
  { key: 'posted', label: 'My Posted Errands', icon: 'paper-plane-outline' },
  { key: 'accepted', label: 'My Accepted Errands', icon: 'checkmark-circle-outline' },
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function DashboardScreen() {
  const { avatarUrl, verificationStatus } = useProfile();
  const [tab, setTab] = useState('posted');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [posted, setPosted] = useState<DashboardErrand[]>([]);
  const [accepted, setAccepted] = useState<DashboardErrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState>({ key: 'budget', dir: 'asc' });
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setUserLat(loc.coords.latitude);
      setUserLng(loc.coords.longitude);
    })();
  }, []);

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

  const showDistance = typeFilter !== 'Remote' && userLat != null && userLng != null;

  // Reset sort to deadline if distance becomes unavailable
  const effectiveSort = (!showDistance && sort.key === 'distance') ? { ...sort, key: 'deadline' as const } : sort;

  const filteredErrands = useMemo(() => {
    let source = tab === 'posted' ? posted : accepted;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      source = source.filter(e => e.title.toLowerCase().includes(q) || (e.poster_name ?? '').toLowerCase().includes(q));
    }
    if (statusFilter) source = source.filter(e => e.status === statusFilter);
    if (typeFilter) source = source.filter(e => typeFilter === 'Remote' ? e.is_remote : !e.is_remote);

    return [...source].sort((a, b) => {
      let diff = 0;
      if (effectiveSort.key === 'deadline') {
        const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        diff = da - db;
      } else if (effectiveSort.key === 'budget') {
        diff = (a.budget ?? 0) - (b.budget ?? 0);
      } else if (effectiveSort.key === 'distance' && userLat != null && userLng != null) {
        const distA = (a.location_lat != null && a.location_lng != null) ? haversineKm(userLat, userLng, a.location_lat, a.location_lng) : Infinity;
        const distB = (b.location_lat != null && b.location_lng != null) ? haversineKm(userLat, userLng, b.location_lat, b.location_lng) : Infinity;
        diff = distA - distB;
      }
      return effectiveSort.dir === 'asc' ? diff : -diff;
    });
  }, [tab, posted, accepted, search, statusFilter, typeFilter, effectiveSort, userLat, userLng]);

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
        <View style={{ paddingTop: 8, paddingBottom: 4 }}>
          <SearchBar value={search} onChangeText={setSearch} />
        </View>
        <View style={{ paddingVertical: 8, zIndex: 10 }}>
          <SortFilterBar
            statusOptions={filterOptions}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            typeFilter={typeFilter}
            onTypeChange={setTypeFilter}
            sort={effectiveSort}
            onSortChange={setSort}
            showDistance={showDistance}
          />
        </View>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <ErrandList
            errands={filteredErrands}
            emptyText={(search || statusFilter || typeFilter) ? 'No tasks found for selected options.' : (tab === 'posted' ? "You haven't posted any errands yet." : "You haven't accepted any errands yet.")}
            viewMode={viewMode}
            search={search}
          />
        )}
      </View>
      <NavBar />
    </View>
  );
}
