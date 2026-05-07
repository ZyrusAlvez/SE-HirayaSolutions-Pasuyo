import { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUsers, FullUserProfile } from '@/controllers/adminController';
import VerificationCard, { PendingUser } from '@/view/presentation/admin/VerificationCard';
import Dropdown from '@/view/components/Dropdown';

const ACCENT = '#FEA405';

type SortKey = 'newest' | 'oldest';

const SORT_OPTIONS: SortKey[] = ['newest', 'oldest'];
const SORT_LABELS: Record<string, string> = { newest: 'Newest', oldest: 'Oldest' };
const SORT_ICONS: Record<string, string> = { newest: 'arrow-down-outline', oldest: 'arrow-up-outline' };

export default function AccountVerificationScreen() {
  const [users, setUsers] = useState<FullUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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

  const toggle = (id: string) => setOpenDropdown(prev => prev === id ? null : id);

  const filtered = useMemo(() => {
    let list = users.filter(u => u.status === 'pending');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u => (u.display_name ?? '').toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const dateA = new Date(a.verification_submitted_at ?? a.created_at).getTime();
      const dateB = new Date(b.verification_submitted_at ?? b.created_at).getTime();
      return sort === 'newest' ? dateB - dateA : dateA - dateB;
    });
    return list;
  }, [users, search, sort]);

  return (
    <View style={[{ flex: 1, backgroundColor: '#F9FAFB' }, Platform.OS === 'web' && { maxWidth: 1200, width: '100%', alignSelf: 'center' as const }]}>
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

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="swap-vertical-outline" size={14} color="#9CA3AF" />
          <Dropdown value={sort} options={SORT_OPTIONS} labels={SORT_LABELS} icon="time-outline" icons={SORT_ICONS} open={openDropdown === 'sort'} onToggle={() => toggle('sort')} onChange={(v) => setSort(v as SortKey)} />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <VerificationCard user={item as unknown as PendingUser} />}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 16 }}
        showsVerticalScrollIndicator={true}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ACCENT]} tintColor={ACCENT} />}
        ListEmptyComponent={
          loading ? (
            <View style={{ padding: 16, gap: 8 }}>
              {[1, 2, 3, 4].map(i => (
                <View key={i} style={{ backgroundColor: 'white', borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#F3F4F6' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#E5E7EB' }} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <View style={{ width: '60%', height: 13, borderRadius: 6, backgroundColor: '#E5E7EB' }} />
                    <View style={{ width: '80%', height: 11, borderRadius: 6, backgroundColor: '#E5E7EB' }} />
                    <View style={{ width: '40%', height: 10, borderRadius: 6, backgroundColor: '#E5E7EB' }} />
                  </View>
                  <View style={{ width: 70, height: 20, borderRadius: 10, backgroundColor: '#E5E7EB' }} />
                </View>
              ))}
            </View>
          ) : (
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 64 }}>
              <Ionicons name="checkmark-done-circle-outline" size={40} color="#E5E7EB" />
              <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8 }}>No pending verifications</Text>
            </View>
          )
        }
      />
    </View>
  );
}
