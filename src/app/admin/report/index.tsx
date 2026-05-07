import { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl, Platform, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getReports, deleteErrandAdmin } from '@/controllers/adminController';
import type { AdminReport } from '@/controllers/adminController';
import { ERRAND_REASONS } from '@/controllers/reportController';
import Dropdown from '@/view/components/Dropdown';
import TabToggle from '@/view/components/TabToggle';
import KebabMenu from '@/view/components/KebabMenu';
import { toast } from '@/utils/toast';

const ACCENT = '#FEA405';

type Tab = 'errand' | 'user';
type SortKey = 'most' | 'least';

const SORT_OPTIONS: SortKey[] = ['most', 'least'];
const SORT_LABELS: Record<string, string> = { most: 'Most Reports', least: 'Least Reports' };
const SORT_ICONS: Record<string, string> = { most: 'arrow-down-outline', least: 'arrow-up-outline' };

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
  const [sort, setSort] = useState<SortKey>('most');
  const [refreshing, setRefreshing] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [selectedReason, setSelectedReason] = useState(ERRAND_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

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

  const handleDelete = async () => {
    const reason = selectedReason === 'Other' ? customReason.trim() : selectedReason;
    if (!reason || !deleteTarget?.errand_id) return;
    setDeleteVisible(false);
    const result = await deleteErrandAdmin(deleteTarget.errand_id, reason);
    if (!result.success) { toast({ title: result.error, preset: 'error' }); return; }
    toast({ title: 'Errand deleted.', preset: 'done' });
    loadReports();
  };

  const toggle = (id: string) => setOpenDropdown(prev => prev === id ? null : id);

  const filtered = useMemo(() => {
    let list = reports.filter(r => r.type === tab);
    // Group by reported entity
    const grouped: Record<string, { key: string; reported_name: string; reported_id: string; errand_id: string | null; reason: string; count: number; latest: string }> = {};
    for (const r of list) {
      const key = tab === 'errand' ? (r.errand_id ?? r.reported_id) : r.reported_id;
      if (!grouped[key]) {
        grouped[key] = { key, reported_name: r.reported_name, reported_id: r.reported_id, errand_id: r.errand_id, reason: r.reason, count: 0, latest: r.created_at };
      }
      grouped[key].count++;
      if (r.created_at > grouped[key].latest) {
        grouped[key].latest = r.created_at;
        grouped[key].reason = r.reason;
      }
    }
    let entries = Object.values(grouped);
    if (search.trim()) {
      const q = search.toLowerCase();
      entries = entries.filter(e => e.reported_name.toLowerCase().includes(q) || e.reason.toLowerCase().includes(q));
    }
    entries.sort((a, b) => {
      return sort === 'most' ? b.count - a.count : a.count - b.count;
    });
    return entries;
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
        keyExtractor={item => item.key}
        renderItem={({ item }) => {
          return (
            <View style={{ backgroundColor: 'white', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }} numberOfLines={1}>{item.reported_name}</Text>
                <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{item.count} {item.count === 1 ? 'report' : 'reports'}</Text>
              </View>
              {tab === 'errand' && item.errand_id && (
                <KebabMenu actions={[
                  { label: 'More Info', icon: 'information-circle-outline', onPress: () => router.push(`/admin/errand/${item.errand_id}`) },
                  { label: 'Delete Errand', icon: 'trash-outline', onPress: () => { setDeleteTarget(item); setDeleteVisible(true); } },
                ]} />
              )}
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

      {/* Delete Reason Modal */}
      <Modal visible={deleteVisible} transparent animationType="fade" onRequestClose={() => setDeleteVisible(false)}>
        <Pressable style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)', padding: 24 }} onPress={() => setDeleteVisible(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 360, maxHeight: '80%' }}>
            <View style={{ padding: 24, paddingBottom: 0 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 }}>Delete Errand</Text>
              <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 19, marginBottom: 16 }}>
                Select a reason for deleting "{deleteTarget?.reported_name}".
              </Text>
            </View>

            <ScrollView style={{ paddingHorizontal: 24 }} contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={true}>
              {ERRAND_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  activeOpacity={0.7}
                  onPress={() => setSelectedReason(reason)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: selectedReason === reason ? '#FEF2F2' : 'transparent', borderWidth: 1, borderColor: selectedReason === reason ? '#FECACA' : '#F3F4F6', marginBottom: 6 }}
                >
                  <Ionicons
                    name={selectedReason === reason ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={selectedReason === reason ? '#EF4444' : '#D1D5DB'}
                  />
                  <Text style={{ fontSize: 13, color: selectedReason === reason ? '#991B1B' : '#374151', fontWeight: selectedReason === reason ? '600' : '400', flex: 1 }}>{reason}</Text>
                </TouchableOpacity>
              ))}
              {selectedReason === 'Other' && (
                <TextInput
                  placeholder="Enter custom reason..."
                  placeholderTextColor="#9CA3AF"
                  value={customReason}
                  onChangeText={setCustomReason}
                  multiline
                  style={{ borderWidth: 1, borderColor: '#FECACA', borderRadius: 10, padding: 12, fontSize: 13, color: '#1F2937', minHeight: 60, marginTop: 4, backgroundColor: '#FEF2F2' } as any}
                />
              )}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, padding: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
              <TouchableOpacity onPress={() => setDeleteVisible(false)} activeOpacity={0.7} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} activeOpacity={0.7} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: (selectedReason === 'Other' && !customReason.trim()) ? '#FCA5A5' : '#EF4444', alignItems: 'center' }} disabled={selectedReason === 'Other' && !customReason.trim()}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
