import { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { getUsers, FullUserProfile } from '../../controllers/adminController';
import UserCard from '../../view/presentation/admin/UserCard';
import VerificationCard, { PendingUser } from '../../view/presentation/admin/VerificationCard';

const ACCENT = '#FEA405';

type SortKey = 'newest' | 'oldest' | 'verified' | 'unverified' | 'pending' | 'suspended';

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Verified', value: 'verified' },
  { label: 'Unverified', value: 'unverified' },
  { label: 'Pending', value: 'pending' },
  { label: 'Suspended', value: 'suspended' },
];

export default function AdminAccountsScreen() {
  const { width } = useWindowDimensions();
  const [users, setUsers] = useState<FullUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [refreshing, setRefreshing] = useState(false);

  const loadUsers = async () => {
    const result = await getUsers();
    console.log('[AdminAccounts] getUsers result:', result.success, result.error, result.data?.length);
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

    if (sort === 'pending') return list.filter(u => u.pending_verification === true);
    if (sort === 'suspended') return list.filter(u => u.is_active === false);
    if (sort === 'verified') return list.filter(u => u.verified === true);
    if (sort === 'unverified') return list.filter(u => u.verified === false);

    switch (sort) {
      case 'newest': list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
      case 'oldest': list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break;
    }

    return list;
  }, [users, search, sort]);

  const chartWidth = Math.min(width - 48, 360);

  const pieData = [
    { name: 'Verified', count: verifiedCount, color: '#22C55E', legendFontColor: '#374151', legendFontSize: 12 },
    { name: 'Unverified', count: unverifiedCount, color: '#EF4444', legendFontColor: '#374151', legendFontSize: 12 },
  ];

  const chartConfig = {
    color: () => '#000',
    labelColor: () => '#374151',
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => sort === 'pending'
          ? <VerificationCard user={item as unknown as PendingUser} />
          : <UserCard user={item} />
        }
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ACCENT]} tintColor={ACCENT} />}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 8 }}>
            {/* Pie Chart */}
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
                  chartConfig={chartConfig}
                  accessor="count"
                  backgroundColor="transparent"
                  paddingLeft="16"
                />
              </View>
            )}

            {/* Search */}
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

            {/* Sort pills */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {SORT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setSort(opt.value)}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: sort === opt.value ? ACCENT : '#E5E7EB', backgroundColor: sort === opt.value ? ACCENT : 'white' }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '500', color: sort === opt.value ? 'white' : '#4B5563' }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
