import { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { getUsers, FullUserProfile } from '../../controllers/adminController';
import { getAllActivity, getAllMessages, getAllReports } from '../../models/adminModel';
import UserCard from '../../view/presentation/admin/UserCard';
import VerificationCard, { PendingUser } from '../../view/presentation/admin/VerificationCard';
import Dropdown from '../../view/components/Dropdown';

const ACCENT = '#FEA405';
const WIDE_BREAKPOINT = 900;

type FilterKey = 'All' | 'Verified' | 'Unverified' | 'Pending' | 'Suspended';
type SortKey = 'newest' | 'oldest';
type TimeRange = 'weekly' | 'monthly' | 'yearly';

const FILTER_OPTIONS: FilterKey[] = ['All', 'Verified', 'Unverified', 'Pending', 'Suspended'];
const FILTER_LABELS: Record<string, string> = { All: 'All', Verified: 'Verified', Unverified: 'Unverified', Pending: 'Pending', Suspended: 'Suspended' };
const FILTER_ICONS: Record<string, string> = { All: 'people-outline', Verified: 'checkmark-circle-outline', Unverified: 'close-circle-outline', Pending: 'time-outline', Suspended: 'ban-outline' };
const FILTER_COLORS: Record<string, string> = { All: '#6B7280', Verified: '#22C55E', Unverified: '#EF4444', Pending: '#F59E0B', Suspended: '#EF4444' };

const SORT_OPTIONS: SortKey[] = ['newest', 'oldest'];
const SORT_LABELS: Record<string, string> = { newest: 'Newest', oldest: 'Oldest' };
const SORT_ICONS: Record<string, string> = { newest: 'arrow-down-outline', oldest: 'arrow-up-outline' };

function buildLineData(activities: { created_at: string }[], range: TimeRange) {
  const now = new Date();
  const labels: string[] = [];
  const counts: number[] = [];

  if (range === 'weekly') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      labels.push(d.toLocaleDateString('en-PH', { weekday: 'short' }));
      counts.push(activities.filter(a => a.created_at.startsWith(dateStr)).length);
    }
  } else if (range === 'monthly') {
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i * 7);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      labels.push(weekStart.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }));
      counts.push(activities.filter(a => {
        const t = new Date(a.created_at);
        return t >= weekStart && t < weekEnd;
      }).length);
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      labels.push(d.toLocaleDateString('en-PH', { month: 'short' }));
      counts.push(activities.filter(a => a.created_at.startsWith(monthStr)).length);
    }
  }

  return { labels, data: counts.length ? counts : [0] };
}

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
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');

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
    Promise.all([
      getAllActivity(),
      getAllMessages(),
      getAllReports(),
    ]).then(([actResult, msgResult, repResult]) => {
      const allItems: { created_at: string }[] = [
        ...(actResult.data ?? []),
        ...(msgResult.data ?? []),
        ...(repResult.data ?? []),
      ];
      setActivities(allItems);
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
      list = list.filter(u =>
        (u.display_name ?? '').toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q)
      );
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
  const lineData = useMemo(() => buildLineData(activities, timeRange), [activities, timeRange]);

  const pieData = [
    { name: 'Verified', count: verifiedCount, color: '#22C55E', legendFontColor: '#374151', legendFontSize: 12 },
    { name: 'Unverified', count: unverifiedCount, color: '#EF4444', legendFontColor: '#374151', legendFontSize: 12 },
  ];

  const pieChartConfig = { color: () => '#000', labelColor: () => '#374151' };

  const toggle = (id: string) => setOpenDropdown(prev => prev === id ? null : id);

  const chartsPanel = (
    <View style={{ gap: 16 }}>
      {/* Pie chart */}
      {users.length > 0 && (
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', alignItems: 'center' }}>
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
            chartConfig={pieChartConfig}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="16"
          />
        </View>
      )}

      {/* Line graph */}
      <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4 }}>
          User Activity
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {(['weekly', 'monthly', 'yearly'] as TimeRange[]).map(r => (
            <TouchableOpacity
              key={r}
              onPress={() => setTimeRange(r)}
              style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: timeRange === r ? ACCENT : '#F3F4F6' }}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: timeRange === r ? 'white' : '#6B7280' }}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <SimpleLineChart data={lineData.data} labels={lineData.labels} height={140} />
      </View>
    </View>
  );

  const listPanel = (
    <View style={{ flex: 1 }}>
      {/* Search & Filter */}
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

      {/* User list */}
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
        ListHeaderComponent={!wide ? chartsPanel : null}
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

  return (
    <View style={[{ flex: 1, backgroundColor: '#F9FAFB' }, Platform.OS === 'web' && { maxWidth: 1200, width: '100%', alignSelf: 'center' as const }]}>
      {wide ? (
        <View style={{ flex: 1, flexDirection: 'row' }}>
          {listPanel}
          <View style={{ width: 340, padding: 16 }}>
            {chartsPanel}
          </View>
        </View>
      ) : (
        listPanel
      )}
    </View>
  );
}

function SimpleLineChart({ data, labels, height }: { data: number[]; labels: string[]; height: number }) {
  const max = Math.max(...data, 1);

  return (
    <View style={{ height, justifyContent: 'flex-end' }}>
      {/* Grid lines */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 20, justifyContent: 'space-between' }}>
        {[...Array(4)].map((_, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 9, color: '#D1D5DB', width: 24, textAlign: 'right', marginRight: 4 }}>
              {Math.round(max - (max / 3) * i)}
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#F3F4F6' }} />
          </View>
        ))}
      </View>

      {/* Bars */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingLeft: 28, flex: 1, gap: 2, paddingBottom: 20 }}>
        {data.map((value, i) => {
          const barHeight = max > 0 ? (value / max) * (height - 36) : 0;
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ width: '70%', maxWidth: 28, height: Math.max(barHeight, 2), backgroundColor: ACCENT, borderRadius: 4, opacity: 0.85 }} />
            </View>
          );
        })}
      </View>

      {/* Labels */}
      <View style={{ flexDirection: 'row', paddingLeft: 28, gap: 2 }}>
        {labels.map((label, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 9, color: '#9CA3AF' }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
