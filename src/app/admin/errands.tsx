import { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Platform, RefreshControl, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../utils/supabase';
import { fetchErrands, Errand } from '../../controllers/adminController';
import AdminNavBar from '../../view/presentation/admin/AdminNavBar';
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
    const result = await fetchErrands();
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
      <View className={`bg-white border-b border-gray-100 ${Platform.OS !== 'web' ? 'pt-12' : 'pt-2'} pb-3 px-6 flex-row items-center justify-between`}>
        <View>
          <Text className="text-xl font-bold text-gray-900">Errands</Text>
          <Text className="text-xs text-gray-400 mt-0.5">{errands.length} total errands</Text>
        </View>
        <TouchableOpacity onPress={() => supabase.auth.signOut()} activeOpacity={0.7} style={{ padding: 8 }}>
          <Ionicons name="log-out-outline" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, padding: 16 }}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text className="text-gray-400 text-sm">Loading errands...</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <ErrandCard errand={item} />}
            contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ACCENT]} tintColor={ACCENT} />}
            ListHeaderComponent={
              <View style={{ gap: 12, marginBottom: 12 }}>
                <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 gap-2">
                  <Ionicons name="search-outline" size={18} color="#9CA3AF" />
                  <TextInput
                    placeholder="Search by title or client..."
                    placeholderTextColor="#9CA3AF"
                    value={search}
                    onChangeText={setSearch}
                    className="flex-1 py-2.5 text-sm text-gray-800"
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
              <View className="items-center justify-center mt-16">
                <Ionicons name="list-outline" size={40} color="#E5E7EB" />
                <Text className="text-gray-400 text-sm mt-2">No errands found</Text>
              </View>
            }
          />
        )}
      </View>

      <AdminNavBar />
    </View>
  );
}
