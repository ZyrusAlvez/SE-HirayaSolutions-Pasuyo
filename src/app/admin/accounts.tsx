import { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { getUsers, FullUserProfile } from '../../controllers/adminController';
import UserCard from '../../view/presentation/admin/UserCard';
import VerificationCard, { PendingUser } from '../../view/presentation/admin/VerificationCard';
import Dropdown from '../../view/components/Dropdown';

const ACCENT = '#FEA405';

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
  const [users, setUsers] = useState<FullUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('All');
  const [sort, setSort] = useState<SortKey>('newest');
  const [refreshing, setRefreshing] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

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
    const interval = setInterval(loadUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  const verifiedCount = useMemo(() => users.filter(u => u.verified).length, [users]);
  const unverifiedCount = useMemo(() => users.filter(u => !u.verified).length, [users]);

  const filtered = useMemo(() => {
    let list = [...users];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        (u.display_name ?? '').toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q)
      );
    }

    switch (filter) {
      case 'Verified': list = list.filter(u => u.verified); break;
      case 'Unverified': list = list.filter(u => !u.verified); break;
      case 'Pending': list = list.filter(u => u.pending_verification); break;
      case 'Suspended': list = list.filter(u => u.is_active === false); break;
    }

    list.sort((a, b) => sort === 'newest'
      ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return list;
  }, [users, search, filter, sort]);

  const chartWidth = Math.min(width - 48, 360);

  const pieData = [
    { name: 'Verified', count: verifiedCount, color: '#22C55E', legendFontColor: '#374151', legendFontSize: 12 },
    { name: 'Unverified', count: unverifiedCount, color: '#EF4444', legendFontColor: '#374151', legendFontSize: 12 },
  ];

  const chartConfig = {
    color: () => '#000',
    labelColor: () => '#374151',
  };

  const toggle = (id: string) => setOpenDropdown(prev => prev === id ? null : id);

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Search & Filter bar - outside FlatList so dropdowns aren't clipped */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 12, zIndex: 100 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, gap: 8 }}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            placeholder="Search by name or email..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, paddingVertical: 10, fontSize: 14, color: '#1F2937' }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', rowGap: 8 }}>
          <Ionicons name="funnel-outline" size={14} color="#9CA3AF" />
          <Dropdown
            value={filter}
            options={FILTER_OPTIONS}
            labels={FILTER_LABELS}
            icon="people-outline"
            icons={FILTER_ICONS}
            iconColors={FILTER_COLORS}
            open={openDropdown === 'filter'}
            onToggle={() => toggle('filter')}
            onChange={(v) => setFilter(v as FilterKey)}
          />
          <View style={{ width: 1, height: 20, backgroundColor: '#E5E7EB' }} />
          <Ionicons name="swap-vertical-outline" size={14} color="#9CA3AF" />
          <Dropdown
            value={sort}
            options={SORT_OPTIONS}
            labels={SORT_LABELS}
            icon="time-outline"
            icons={SORT_ICONS}
            open={openDropdown === 'sort'}
            onToggle={() => toggle('sort')}
            onChange={(v) => setSort(v as SortKey)}
          />
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

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => filter === 'Pending'
          ? <VerificationCard user={item as unknown as PendingUser} />
          : <UserCard user={item} />
        }
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ACCENT]} tintColor={ACCENT} />}
        ListHeaderComponent={
          users.length > 0 ? (
            <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4 }}>
                Accounts Overview
              </Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
                {verifiedCount} verified · {unverifiedCount} unverified · {users.length} total
              </Text>
              <PieChart
                data={pieData}
                width={chartWidth}
                height={180}
                chartConfig={chartConfig}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="16"
              />
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 64 }}>
              <Text style={{ color: '#9CA3AF', fontSize: 14 }}>Loading users...</Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 64 }}>
              <Ionicons name="people-outline" size={40} color="#E5E7EB" />
              <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8 }}>No users found</Text>
            </View>
          )
        }
      />
    </View>
  );
}
