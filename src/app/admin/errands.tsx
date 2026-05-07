import { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getErrands, Errand } from '../../controllers/adminController';
import ErrandCard from '../../view/presentation/admin/ErrandCard';
import Dropdown from '../../view/components/Dropdown';

const ACCENT = '#FEA405';
const WIDE_BREAKPOINT = 900;

type FilterKey = 'All' | 'Available' | 'In Progress' | 'Completed' | 'Expired';
type SortKey = 'newest' | 'oldest';

const FILTER_OPTIONS: FilterKey[] = ['All', 'Available', 'In Progress', 'Completed', 'Expired'];
const FILTER_LABELS: Record<string, string> = { All: 'All', Available: 'Available', 'In Progress': 'In Progress', Completed: 'Completed', Expired: 'Expired' };
const FILTER_ICONS: Record<string, string> = { All: 'list-outline', Available: 'checkmark-circle-outline', 'In Progress': 'time-outline', Completed: 'checkmark-done-circle-outline', Expired: 'alert-circle-outline' };
const FILTER_COLORS: Record<string, string> = { All: '#6B7280', Available: '#22C55E', 'In Progress': '#F59E0B', Completed: '#22C55E', Expired: '#EF4444' };

const SORT_OPTIONS: SortKey[] = ['newest', 'oldest'];
const SORT_LABELS: Record<string, string> = { newest: 'Newest', oldest: 'Oldest' };
const SORT_ICONS: Record<string, string> = { newest: 'arrow-down-outline', oldest: 'arrow-up-outline' };

function getEffectiveStatus(errand: Errand): string {
  if (errand.status === 'Available' && errand.deadline && new Date(errand.deadline) < new Date()) {
    return 'Expired';
  }
  return errand.status;
}

export default function AdminErrandsScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;
  const [errands, setErrands] = useState<Errand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('All');
  const [sort, setSort] = useState<SortKey>('newest');
  const [refreshing, setRefreshing] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const loadErrands = async () => {
    const result = await getErrands();
    if (result.success && result.data) setErrands(result.data);
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadErrands();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadErrands();
    const interval = setInterval(loadErrands, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggle = (id: string) => setOpenDropdown(prev => prev === id ? null : id);

  const filtered = useMemo(() => {
    let list = errands.map(e => ({ ...e, _effectiveStatus: getEffectiveStatus(e) }));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.poster_name ?? '').toLowerCase().includes(q)
      );
    }
    if (filter !== 'All') list = list.filter(e => e._effectiveStatus === filter);
    list.sort((a, b) => {
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return sort === 'newest' ? diff : -diff;
    });
    return list;
  }, [errands, search, filter, sort]);

  return (
    <View style={[{ flex: 1, backgroundColor: '#F9FAFB' }, Platform.OS === 'web' && { maxWidth: 1200, width: '100%', alignSelf: 'center' as const }]}>
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 12, zIndex: 100 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, gap: 8 }}>
            <Ionicons name="search-outline" size={18} color="#9CA3AF" />
            <TextInput
              placeholder="Search by title or client..."
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
            <Dropdown value={filter} options={FILTER_OPTIONS} labels={FILTER_LABELS} icon="list-outline" icons={FILTER_ICONS} iconColors={FILTER_COLORS} open={openDropdown === 'filter'} onToggle={() => toggle('filter')} onChange={(v) => setFilter(v as FilterKey)} />
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
          renderItem={({ item }) => <ErrandCard errand={item} />}
          contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 16 }}
          showsVerticalScrollIndicator={true}
          numColumns={wide ? 2 : 1}
          key={wide ? 'wide' : 'narrow'}
          columnWrapperStyle={wide ? { gap: 12 } : undefined}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ACCENT]} tintColor={ACCENT} />}
          ListEmptyComponent={
            loading ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 64 }}>
                <Text style={{ color: '#9CA3AF', fontSize: 14 }}>Loading errands...</Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 64 }}>
                <Ionicons name="list-outline" size={40} color="#E5E7EB" />
                <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8 }}>No errands found</Text>
              </View>
            )
          }
        />
      </View>
    </View>
  );
}
