import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type SortKey = 'deadline' | 'budget' | 'distance';
export type SortDir = 'asc' | 'desc';
export interface SortState { key: SortKey | null; dir: SortDir; }

interface Props {
  sort: SortState;
  onSort: (s: SortState) => void;
  keys: SortKey[];
}

const LABELS: Record<SortKey, string> = { deadline: 'Deadline', budget: 'Budget', distance: 'Distance' };

export default function SortBar({ sort, onSort, keys }: Props) {
  const toggle = (key: SortKey) => {
    onSort(sort.key === key
      ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: 'asc' });
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 4 }}>
      <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '500', marginRight: 6 }}>Sort</Text>
      {keys.map((key, i) => {
        const active = sort.key === key;
        return (
          <View key={key} style={{ flexDirection: 'row', alignItems: 'center' }}>
            {i > 0 && <View style={{ width: 1, height: 10, backgroundColor: '#E5E7EB', marginHorizontal: 4 }} />}
            <TouchableOpacity
              onPress={() => toggle(key)}
              activeOpacity={0.6}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingBottom: 2, borderBottomWidth: active ? 1.5 : 0, borderBottomColor: '#FEA405' }}
            >
              <Text style={{ fontSize: 12, fontWeight: active ? '700' : '500', color: active ? '#FEA405' : '#6B7280' }}>
                {LABELS[key]}
              </Text>
              {active && (
                <Ionicons
                  name={sort.dir === 'asc' ? 'arrow-up' : 'arrow-down'}
                  size={10}
                  color="#FEA405"
                />
              )}
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}
