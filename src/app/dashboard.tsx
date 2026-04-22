import { useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDashboardErrands } from '@/controllers/errandController';
import type { DashboardErrand } from '@/controllers/errandController';
import { useProfile } from '@/context/ProfileContext';
import Header from '@/view/components/Header';
import NavBar from '@/view/components/NavBar';
import TabToggle from '@/view/components/TabToggle';

const TABS = [
  { key: 'posted', label: 'Posted Errands', icon: 'paper-plane-outline' },
  { key: 'accepted', label: 'Accepted Errands', icon: 'checkmark-circle-outline' },
];

const STATUS_COLORS: Record<string, string> = {
  Available: '#10B981',
  'In Progress': '#F59E0B',
  Completed: '#3B82F6',
  Expired: '#EF4444',
};

function ErrandRow({ errand }: { errand: DashboardErrand }) {
  const color = STATUS_COLORS[errand.status] ?? '#6B7280';

  return (
    <View
      style={{ padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
    >
      <View style={{ flex: 1, marginRight: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }} numberOfLines={1}>{errand.title}</Text>
        {errand.budget != null && (
          <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>₱{errand.budget.toLocaleString()}</Text>
        )}
      </View>
      <View style={{ backgroundColor: color + '1A', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color }}>{errand.status}</Text>
      </View>
    </View>
  );
}

function ErrandList({ errands, emptyText }: { errands: DashboardErrand[]; emptyText: string }) {
  if (errands.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 64 }}>
        <Ionicons name="document-text-outline" size={48} color="#E5E7EB" />
        <Text style={{ color: '#9CA3AF', marginTop: 8 }}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
      <View style={{ backgroundColor: 'white', borderRadius: 14, borderWidth: 1, borderColor: '#F3F4F6', overflow: 'hidden' }}>
        {errands.map((e, i) => (
          <View key={e.id} style={i < errands.length - 1 ? { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' } : undefined}>
            <ErrandRow errand={e} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export default function DashboardScreen() {
  const { avatarUrl, verificationStatus } = useProfile();
  const [tab, setTab] = useState('posted');
  const [posted, setPosted] = useState<DashboardErrand[]>([]);
  const [accepted, setAccepted] = useState<DashboardErrand[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    getDashboardErrands().then((result) => {
      if (result.success) {
        setPosted(result.data.posted);
        setAccepted(result.data.accepted);
      }
      setLoading(false);
    });
  }, []));

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <Header avatarUrl={avatarUrl} verificationStatus={verificationStatus} />
      <TabToggle tabs={TABS} activeKey={tab} onTabChange={setTab} />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#FEA405" />
        </View>
      ) : tab === 'posted' ? (
        <ErrandList errands={posted} emptyText="You haven't posted any errands yet." />
      ) : (
        <ErrandList errands={accepted} emptyText="You haven't accepted any errands yet." />
      )}
      <NavBar />
    </View>
  );
}
