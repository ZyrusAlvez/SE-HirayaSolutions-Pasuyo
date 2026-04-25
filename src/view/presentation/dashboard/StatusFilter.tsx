import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

const STATUS_COLORS: Record<string, string> = {
  Available: '#10B981',
  'In Progress': '#F59E0B',
  Completed: '#3B82F6',
  Expired: '#EF4444',
  Cancelled: '#6B7280',
};

interface Props {
  options: string[];
  selected: string | null;
  onSelect: (status: string | null) => void;
}

export default function StatusFilter({ options, selected, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
      <Chip label="All" active={selected === null} color="#6B7280" onPress={() => onSelect(null)} />
      {options.map(s => (
        <Chip key={s} label={s} active={selected === s} color={STATUS_COLORS[s] ?? '#6B7280'} onPress={() => onSelect(s)} />
      ))}
    </ScrollView>
  );
}

function Chip({ label, active, color, onPress }: { label: string; active: boolean; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: active ? color + '1A' : '#F3F4F6',
        borderWidth: 1,
        borderColor: active ? color : '#E5E7EB',
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: '600', color: active ? color : '#9CA3AF' }}>{label}</Text>
    </TouchableOpacity>
  );
}
