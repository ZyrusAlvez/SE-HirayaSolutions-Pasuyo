import { useState } from 'react';
import { View, Text } from 'react-native';
import Dropdown from '@/view/components/Dropdown';

interface Props {
  statusOptions: string[];
  statusFilter: string | null;
  onStatusChange: (v: string | null) => void;
  typeFilter: string | null;
  onTypeChange: (v: string | null) => void;
}

const TYPE_OPTIONS = ['All', 'Remote', 'Onsite'];
const TYPE_LABELS: Record<string, string> = { All: 'All', Remote: 'Remote', Onsite: 'Onsite' };

export default function SortFilterBar({ statusOptions, statusFilter, onStatusChange, typeFilter, onTypeChange }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const toggle = (id: string) => setOpenId(prev => prev === id ? null : id);

  const allStatusOptions = ['All', ...statusOptions];
  const statusLabels = Object.fromEntries(allStatusOptions.map(o => [o, o]));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 14, zIndex: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '500' }}>Status:</Text>
        <Dropdown
          value={statusFilter ?? 'All'}
          options={allStatusOptions}
          labels={statusLabels}
          icon="funnel-outline"
          open={openId === 'status'}
          onToggle={() => toggle('status')}
          onChange={(v) => onStatusChange(v === 'All' ? null : v)}
        />
      </View>
      <View style={{ width: 1, height: 20, backgroundColor: '#E5E7EB' }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '500' }}>Type:</Text>
        <Dropdown
          value={typeFilter ?? 'All'}
          options={TYPE_OPTIONS}
          labels={TYPE_LABELS}
          icon="globe-outline"
          open={openId === 'type'}
          onToggle={() => toggle('type')}
          onChange={(v) => onTypeChange(v === 'All' ? null : v)}
        />
      </View>
    </View>
  );
}
