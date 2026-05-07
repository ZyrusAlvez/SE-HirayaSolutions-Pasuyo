import { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getReports } from '@/controllers/adminController';
import type { AdminReport } from '@/controllers/adminController';
import Dropdown from '@/view/components/Dropdown';
import TabToggle from '@/view/components/TabToggle';

const ACCENT = '#FEA405';

type Tab = 'errand' | 'user';
type SortKey = 'newest' | 'oldest';

const SORT_OPTIONS: SortKey[] = ['newest', 'oldest'];
const SORT_LABELS: Record<string, string> = { newest: 'Newest', oldest: 'Oldest' };
const SORT_ICONS: Record<string, string> = { newest: 'arrow-down-outline', oldest: 'arrow-up-outline' };

const STATUS_COLORS: Record<string, string> = { pending: '#F59E0B', resolved: '#22C55E', dismissed: '#6B7280' };

const TABS = [
  { key: 'errand', label: 'Errand Reports', icon: 'document-text-outline' },
  { key: 'user', label: 'Account Reports', icon: 'person-outline' },
];

export default function ReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('errand');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [refreshing, setRefreshing] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const loadReports = async () => {
    const result = await getReports();
    if (result.success && result.data) setReports(result.data);
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  }, []);

  useEffect(() => { loadReports(); }, []);

  const toggle = (id: string) => setOpenDropdown(prev => prev === id ? null : id);

  const filtered = useMemo(() => {
    let list = reports.filter(r => r.type === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.reporter_name.toLowerCase().includes(q) ||
        r.reported_name.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return sort === 'newest' ? diff : -diff;
    });
    return list;
  }, [reports, tab, search, sort]);

  return (
    <View style={[{ flex: 1, backgroundColor: '#F9FAFB' }, Platform.OS === 'web' && { maxWidth: 1200, width: '100%', alignSelf: 'center' as const }]}>
      {/* Tabs */}
      <TabToggle tabs={TABS} activeKey={tab} onTabChange={(k) => setTab(k as Tab)} />

      {/* Search + Sort */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 12, zIndex: 100 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, gap: 8 }}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            placeholder="Search by name or reason..."
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

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const color = STATUS_COLORS[item.status] ?? '#6B7280';
          return (
            <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#F3F4F6' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827', flex: 1 }} numberOfLines={1}>
                  {item.reported_name}
                </Text>
                <View style={{ backgroundColor: color + '1A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color }}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>{item.reason}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 11, color: '#9CA3AF' }}>
                  Reported by {item.reporter_name} · {new Date(item.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
            </View>
          );
        }}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 16 }}
        showsVerticalScrollIndicator={true}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ACCENT]} tintColor={ACCENT} />}
        ListEmptyComponent={
          loading ? (
            <View style={{ gap: 8 }}>
              {[1, 2, 3, 4].map(i => (
                <View key={i} style={{ backgroundColor: 'white', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#F3F4F6', gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ width: '50%', height: 13, borderRadius: 6, backgroundColor: '#E5E7EB' }} />
                    <View style={{ width: 50, height: 16, borderRadius: 8, backgroundColor: '#E5E7EB' }} />
                  </View>
                  <View style={{ width: '70%', height: 12, borderRadius: 6, backgroundColor: '#E5E7EB' }} />
                  <View style={{ width: '60%', height: 11, borderRadius: 6, backgroundColor: '#E5E7EB' }} />
                </View>
              ))}
            </View>
          ) : (
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 64 }}>
              <Ionicons name="flag-outline" size={40} color="#E5E7EB" />
              <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8 }}>No {tab === 'errand' ? 'errand' : 'account'} reports</Text>
            </View>
          )
        }
      />
    </View>
  );
}
