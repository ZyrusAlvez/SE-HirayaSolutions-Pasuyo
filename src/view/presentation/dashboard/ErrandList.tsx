import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DashboardErrand } from '@/controllers/errandController';
import ErrandCard from './ErrandCard';

interface Props {
  errands: DashboardErrand[];
  emptyText: string;
}

export default function ErrandList({ errands, emptyText }: Props) {
  if (errands.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 64 }}>
        <Ionicons name="document-text-outline" size={48} color="#E5E7EB" />
        <Text style={{ color: '#9CA3AF', marginTop: 8 }}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 32 }}>
      {errands.map((e) => <ErrandCard key={e.id} errand={e} />)}
    </ScrollView>
  );
}
