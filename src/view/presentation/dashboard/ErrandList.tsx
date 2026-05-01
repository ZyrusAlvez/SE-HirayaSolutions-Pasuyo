import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DashboardErrand } from '@/controllers/errandController';
import ErrandCard from './ErrandCard';
import ErrandRow from './ErrandRow';

interface Props {
  errands: DashboardErrand[];
  emptyText: string;
  viewMode: 'card' | 'list';
  search?: string;
  tab?: string;
  onDelete?: () => void;
}

export default function ErrandList({ errands, emptyText, viewMode, search = '', tab = 'posted', onDelete }: Props) {
  if (errands.length === 0) {
    return (
      <View testID="dashboard-empty-state" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 64 }}>
        <Ionicons name="document-text-outline" size={48} color="#E5E7EB" />
        <Text style={{ color: '#9CA3AF', marginTop: 8 }}>{emptyText}</Text>
      </View>
    );
  }

  if (viewMode === 'list') {
    return (
      <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <View style={{ backgroundColor: 'white', borderRadius: 14, borderWidth: 1, borderColor: '#F3F4F6', overflow: 'hidden' }}>
          {errands.map((e, i) => (
            <View key={e.id} style={i < errands.length - 1 ? { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' } : undefined}>
              <ErrandRow errand={e} search={search} tab={tab} onDelete={onDelete} />
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  const { width } = useWindowDimensions();
  const columns = width >= 1024 ? 4 : width >= 768 ? 3 : 2;
  const cardWidth = `${Math.floor(100 / columns) - 2}%` as const;

  return (
    <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {errands.map((e) => (
          <View key={e.id} style={{ width: cardWidth }}>
            <ErrandCard errand={e} search={search} tab={tab} onDelete={onDelete} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
