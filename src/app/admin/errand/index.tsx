import { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl, useWindowDimensions, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getErrands, Errand } from '@/controllers/adminController';
import ErrandCard from '@/view/presentation/admin/ErrandCard';
import ErrandsChartPanel from '@/view/presentation/admin/ErrandsChartPanel';
import { ErrandsListSkeleton, ErrandsChartSkeleton } from '@/view/presentation/admin/ErrandsSkeleton';
import Dropdown from '@/view/components/Dropdown';

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
  const [actionLoading, setActionLoading] = useState(false);

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

  const errandsWithStatus = useMemo(() =>
    errands.map(e => ({ ...e, _effectiveStatus: getEffectiveStatus(e) })),
    [errands]
  );

  const chartData = useMemo(() => {
    const total = errandsWithStatus.length;
    const completed = errandsWithStatus.filter(e => e._effectiveStatus === 'Completed').length;
    const available = errandsWithStatus.filter(e => e._effectiveStatus === 'Available').length;
    const inProgress = errandsWithStatus.filter(e => e._effectiveStatus === 'In Progress').length;
    const expired = errandsWithStatus.filter(e => e._effectiveStatus === 'Expired').length;
    return { total, completed, available, inProgress, expired };
  }, [errandsWithStatus]);

  const filtered = useMemo(() => {
    let list = [...errandsWithStatus];
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
  }, [errandsWithStatus, search, filter, sort]);

  const chartWidth = wide ? 280 : Math.min(width - 48, 360);

  const chartsPanel = (
    <ErrandsChartPanel
      total={chartData.total}
      completed={chartData.completed}
      available={chartData.available}
      inProgress={chartData.inProgress}
      expired={chartData.expired}
      errands={errandsWithStatus}
      chartWidth={chartWidth}
    />
  );

  const listPanel = (
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
        renderItem={({ item }) => <ErrandCard errand={item} onDelete={loadErrands} onLoadingChange={setActionLoading} />}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 16 }}
        showsVerticalScrollIndicator={true}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ACCENT]} tintColor={ACCENT} />}
        ListHeaderComponent={!wide ? <View style={{ marginBottom: 12 }}>{loading ? <ErrandsChartSkeleton /> : chartsPanel}</View> : null}
        ListEmptyComponent={
          loading ? <ErrandsListSkeleton /> : (
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 64 }}>
              <Ionicons name="list-outline" size={40} color="#E5E7EB" />
              <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8 }}>No errands found</Text>
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
            {loading ? <ErrandsChartSkeleton /> : chartsPanel}
          </View>
        </View>
      ) : (
        listPanel
      )}
      {actionLoading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      )}
    </View>
  );
}
