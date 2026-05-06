import { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getErrands, Errand } from '../../controllers/adminController';
import ErrandCard from '../../view/presentation/admin/ErrandCard';

const ACCENT = '#FEA405';

type FilterKey = 'All' | 'Available' | 'In Progress' | 'Completed' | 'Expired';
const FILTERS: FilterKey[] = ['All', 'Available', 'In Progress', 'Completed', 'Expired'];

export default function AdminErrandsScreen() {
  const [errands, setErrands] = useState<Errand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('All');
  const [refreshing, setRefreshing] = useState(false);

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

  const filtered = useMemo(() => {
    let list = [...errands];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.poster_name ?? '').toLowerCase().includes(q)
      );
    }
    if (filter !== 'All') list = list.filter(e => e.status === filter);
    return list;
  }, [errands, search, filter]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ErrandCard errand={item} />}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ACCENT]} tintColor={ACCENT} />}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, gap: 8 }}>
              <Ionicons name="search-outline" size={18} color="#9CA3AF" />
              <TextInput
                placeholder="Search by title or client..."
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
              {FILTERS.map(f => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFilter(f)}
                  activeOpacity={0.7}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: filter === f ? ACCENT : '#E5E7EB', backgroundColor: filter === f ? ACCENT : 'white' }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '500', color: filter === f ? 'white' : '#4B5563' }}>{f}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
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
  );
}
