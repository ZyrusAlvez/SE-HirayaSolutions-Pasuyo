import { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getPendingPayments } from '@/controllers/adminController';
import type { PendingPayment } from '@/controllers/adminController';
import Dropdown from '@/view/components/Dropdown';

const ACCENT = '#FEA405';

type SortKey = 'newest' | 'oldest';

const SORT_OPTIONS: SortKey[] = ['newest', 'oldest'];
const SORT_LABELS: Record<string, string> = { newest: 'Newest', oldest: 'Oldest' };
const SORT_ICONS: Record<string, string> = { newest: 'arrow-down-outline', oldest: 'arrow-up-outline' };

export default function PaymentVerificationScreen() {
  const router = useRouter();
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [refreshing, setRefreshing] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const loadPayments = async () => {
    const result = await getPendingPayments();
    if (result.success && result.data) setPayments(result.data);
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadPayments();
  }, []);

  const toggle = (id: string) => setOpenDropdown(prev => prev === id ? null : id);

  const filtered = useMemo(() => {
    let list = [...payments];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.user_name.toLowerCase().includes(q) || p.reference_no.includes(q));
    }
    list.sort((a, b) => {
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return sort === 'newest' ? diff : -diff;
    });
    return list;
  }, [payments, search, sort]);

  return (
    <View style={[{ flex: 1, backgroundColor: '#F9FAFB' }, Platform.OS === 'web' && { maxWidth: 1200, width: '100%', alignSelf: 'center' as const }]}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 12, zIndex: 100 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, gap: 8 }}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            placeholder="Search by name or reference..."
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
        renderItem={({ item }) => (
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#F3F4F6' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{item.user_name}</Text>
              <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                {new Date(item.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#D97706' }}>₱{item.amount.toLocaleString()}</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push(`/admin/payment-verification/${item.id}`)}
              style={{ backgroundColor: ACCENT, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Verify</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 16 }}
        showsVerticalScrollIndicator={true}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ACCENT]} tintColor={ACCENT} />}
        ListEmptyComponent={
          loading ? (
            <View style={{ gap: 8 }}>
              {[1, 2, 3, 4].map(i => (
                <View key={i} style={{ backgroundColor: 'white', borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#F3F4F6' }}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <View style={{ width: '50%', height: 14, borderRadius: 6, backgroundColor: '#E5E7EB' }} />
                    <View style={{ width: '70%', height: 11, borderRadius: 6, backgroundColor: '#E5E7EB' }} />
                    <View style={{ width: '40%', height: 10, borderRadius: 6, backgroundColor: '#E5E7EB' }} />
                  </View>
                  <View style={{ width: 60, height: 14, borderRadius: 6, backgroundColor: '#E5E7EB' }} />
                  <View style={{ width: 60, height: 28, borderRadius: 10, backgroundColor: '#E5E7EB' }} />
                </View>
              ))}
            </View>
          ) : (
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 64 }}>
              <Ionicons name="card-outline" size={40} color="#E5E7EB" />
              <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8 }}>No pending payments</Text>
            </View>
          )
        }
      />
    </View>
  );
}
