import { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUsers, FullUserProfile } from '../../controllers/adminController';
import { getAllActivity, getAllMessages, getAllReports } from '../../models/adminModel';
import UserCard from '../../view/presentation/admin/UserCard';
import VerificationCard, { PendingUser } from '../../view/presentation/admin/VerificationCard';
import AccountsChartsPanel from '../../view/presentation/admin/AccountsChartsPanel';
import { AccountsListSkeleton, AccountsChartSkeleton } from '../../view/presentation/admin/AccountsSkeleton';
import Dropdown from '../../view/components/Dropdown';

const ACCENT = '#FEA405';
const WIDE_BREAKPOINT = 900;

type FilterKey = 'All' | 'Verified' | 'Unverified' | 'Pending' | 'Suspended';
type SortKey = 'newest' | 'oldest';

const FILTER_OPTIONS: FilterKey[] = ['All', 'Verified', 'Unverified', 'Pending', 'Suspended'];
const FILTER_LABELS: Record<string, string> = { All: 'All', Verified: 'Verified', Unverified: 'Unverified', Pending: 'Pending', Suspended: 'Suspended' };
const FILTER_ICONS: Record<string, string> = { All: 'people-outline', Verified: 'checkmark-circle-outline', Unverified: 'close-circle-outline', Pending: 'time-outline', Suspended: 'ban-outline' };
const FILTER_COLORS: Record<string, string> = { All: '#6B7280', Verified: '#22C55E', Unverified: '#EF4444', Pending: '#F59E0B', Suspended: '#EF4444' };

const SORT_OPTIONS: SortKey[] = ['newest', 'oldest'];
const SORT_LABELS: Record<string, string> = { newest: 'Newest', oldest: 'Oldest' };
const SORT_ICONS: Record<string, string> = { newest: 'arrow-down-outline', oldest: 'arrow-up-outline' };

export default function AdminAccountsScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;
  const [users, setUsers] = useState<FullUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('All');
  const [sort, setSort] = useState<SortKey>('newest');
  const [refreshing, setRefreshing] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [activities, setActivities] = useState<{ created_at: string }[]>([]);

  const loadUsers = async () => {
    const result = await getUsers();
    if (result.success && result.data) setUsers(result.data);
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadUsers();
    Promise.all([getAllActivity(), getAllMessages(), getAllReports()]).then(([act, msg, rep]) => {
      setActivities([...(act.data ?? []), ...(msg.data ?? []), ...(rep.data ?? [])]);
    });
    const interval = setInterval(loadUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  const verifiedCount = useMemo(() => users.filter(u => u.status === 'verified').length, [users]);
  const unverifiedCount = useMemo(() => users.filter(u => u.status !== 'verified').length, [users]);

  const filtered = useMemo(() => {
    let list = [...users];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u => (u.display_name ?? '').toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q));
    }
    switch (filter) {
      case 'Verified': list = list.filter(u => u.status === 'verified'); break;
      case 'Unverified': list = list.filter(u => u.status === 'unverified'); break;
      case 'Pending': list = list.filter(u => u.status === 'pending'); break;
      case 'Suspended': list = list.filter(u => u.status === 'suspended'); break;
    }
    list.sort((a, b) => sort === 'newest'
      ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    return list;
  }, [users, search, filter, sort]);

  const chartWidth = wide ? 280 : Math.min(width - 48, 360);
  const toggle = (id: string) => setOpenDropdown(prev => prev === id ? null : id);

  const chartsPanel = (
    <AccountsChartsPanel
      verifiedCount={verifiedCount}
      unverifiedCount={unverifiedCount}
      totalCount={users.length}
      activities={activities}
      chartWidth={chartWidth}
    />
  );

  const listPanel = (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 12, zIndex: 100 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, gap: 8 }}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            placeholder="Search by name or email..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, paddingVertical: 10, fontSize: 14, color: '#1F2937', outlineStyle: 'none' } as any}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', rowGap: 8 }}>
          <Ionicons name="funnel-outline" size={14} color="#9CA3AF" />
          <Dropdown value={filter} options={FILTER_OPTIONS} labels={FILTER_LABELS} icon="people-outline" icons={FILTER_ICONS} iconColors={FILTER_COLORS} open={openDropdown === 'filter'} onToggle={() => toggle('filter')} onChange={(v) => setFilter(v as FilterKey)} />
          <View style={{ width: 1, height: 20, backgroundColor: '#E5E7EB' }} />
          <Ionicons name="swap-vertical-outline" size={14} color="#9CA3AF" />
          <Dropdown value={sort} options={SORT_OPTIONS} labels={SORT_LABELS} icon="time-outline" icons={SORT_ICONS} open={openDropdown === 'sort'} onToggle={() => toggle('sort')} onChange={(v) => setSort(v as SortKey)} />
          {filter !== 'All' && (
            <>
              <View style={{ width: 1, height: 20, backgroundColor: '#E5E7EB' }} />
              <TouchableOpacity onPress={() => setFilter('All')} activeOpacity={0.7} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '600' }}>Clear</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => filter === 'Pending'
          ? <VerificationCard user={item as unknown as PendingUser} />
          : <UserCard user={item} onRefresh={loadUsers} />
        }
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 16 }}
        showsVerticalScrollIndicator={true}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ACCENT]} tintColor={ACCENT} />}
        ListHeaderComponent={!wide ? <View style={{ marginBottom: 12 }}>{chartsPanel}</View> : null}
        ListEmptyComponent={
          loading ? <AccountsListSkeleton /> : (
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 64 }}>
              <Ionicons name="people-outline" size={40} color="#E5E7EB" />
              <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8 }}>No users found</Text>
            </View>
          )
        }
      />
    </View>
  );

  return (
    <View style={[{ flex: 1, backgroundColor: '#F9FAFB' }, Platform.OS === 'web' && { maxWidth: 1200, width: '100%', alignSelf: 'center' as const }]}>
      {wide ? (
        <View style={{ flex: 1, flexDirection: 'row' }}>
          {listPanel}
          <View style={{ width: 340, padding: 16 }}>
            {loading ? <AccountsChartSkeleton /> : chartsPanel}
          </View>
        </View>
      ) : (
        listPanel
      )}
    </View>
  );
}
