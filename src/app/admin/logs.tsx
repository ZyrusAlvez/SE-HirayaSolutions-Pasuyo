import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Platform, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLogs, getLogsSubscription, removeLogsSubscription, LogEntry } from '../../controllers/adminController';
import AdminNavBar from '../../view/presentation/admin/AdminNavBar';

const ACCENT = '#FEA405';

const ACTION_STYLES: Record<string, { bg: string; text: string }> = {
  APPROVED_VERIFICATION: { bg: '#DCFCE7', text: '#15803D' },
  REJECTED_VERIFICATION: { bg: '#FEE2E2', text: '#DC2626' },
  SUSPENDED_USER:        { bg: '#FEE2E2', text: '#DC2626' },
  RESTORED_USER:         { bg: '#DBEAFE', text: '#1D4ED8' },
};

export default function AdminLogsScreen() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLogs = async () => {
    const result = await getLogs();
    if (result.success && result.data) setLogs(result.data);
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadLogs();
    const channel = getLogsSubscription(loadLogs);
    return () => { removeLogsSubscription(channel); };
  }, []);

  const renderItem = ({ item }: { item: LogEntry }) => {
    const style = ACTION_STYLES[item.action] ?? { bg: '#F3F4F6', text: '#6B7280' };
    const date = new Date(item.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
      <View className="bg-white rounded-2xl px-4 py-3 border border-gray-100 gap-1">
        <View className="flex-row items-center justify-between">
          <View style={{ backgroundColor: style.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: style.text }}>{item.action}</Text>
          </View>
          <Text className="text-xs text-gray-400">{date}</Text>
        </View>
        {item.details && <Text className="text-xs text-gray-600 mt-1">{item.details}</Text>}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View className={`bg-white border-b border-gray-100 ${Platform.OS !== 'web' ? 'pt-12' : 'pt-2'} pb-3 px-6 flex-row items-center justify-between`}>
        <View>
          <Text className="text-xl font-bold text-gray-900">Action Logs</Text>
          <Text className="text-xs text-gray-400 mt-0.5">{logs.length} total entries</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text className="text-gray-400 text-sm">Loading logs...</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ACCENT]} tintColor={ACCENT} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 64 }}>
              <Ionicons name="document-text-outline" size={40} color="#E5E7EB" />
              <Text className="text-gray-400 text-sm mt-2">No logs yet</Text>
            </View>
          }
        />
      )}

      <AdminNavBar />
    </View>
  );
}
