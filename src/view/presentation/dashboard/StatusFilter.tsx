import { useState } from 'react';
import { View, Text } from 'react-native';
import Dropdown from '@/view/components/Dropdown';

interface Props {
  options: string[];
  selected: string | null;
  onSelect: (status: string | null) => void;
}

export default function StatusFilter({ options, selected, onSelect }: Props) {
  const [open, setOpen] = useState(false);

  const allOptions = ['All', ...options];
  const labels = Object.fromEntries(allOptions.map(o => [o, o]));
  const value = selected ?? 'All';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 8, zIndex: 10 }}>
      <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '500' }}>Filter:</Text>
      <Dropdown
        value={value}
        options={allOptions}
        labels={labels}
        icon="funnel-outline"
        open={open}
        onToggle={() => setOpen(o => !o)}
        onChange={(v) => onSelect(v === 'All' ? null : v)}
      />
    </View>
  );
}
