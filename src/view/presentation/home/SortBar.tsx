import { useState } from 'react';
import { View, Text } from 'react-native';
import Dropdown from '@/view/components/Dropdown';

export type SortKey = 'deadline' | 'budget' | 'distance';
export type SortDir = 'asc' | 'desc';
export interface SortState { key: SortKey; dir: SortDir; }

interface Props {
  sort: SortState;
  onSort: (s: SortState) => void;
  keys: SortKey[];
}

const LABELS: Record<SortKey, string> = { deadline: 'Deadline', budget: 'Budget', distance: 'Distance' };
const DIR_LABELS: Record<SortDir, string> = { asc: 'Increasing', desc: 'Decreasing' };
const DIR_ICONS: Record<SortDir, string> = { asc: 'arrow-up-outline', desc: 'arrow-down-outline' };

export default function SortBar({ sort, onSort, keys }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const toggle = (id: string) => setOpenId(prev => prev === id ? null : id);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8, zIndex: 10 }}>
      <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '500' }}>Sort:</Text>
      <Dropdown
        value={sort.key}
        options={keys}
        labels={LABELS}
        icon="grid-outline"
        open={openId === 'key'}
        onToggle={() => toggle('key')}
        onChange={(key) => onSort({ ...sort, key })}
      />
      <Dropdown
        value={sort.dir}
        options={['asc', 'desc'] as SortDir[]}
        labels={DIR_LABELS}
        icon={DIR_ICONS[sort.dir]}
        open={openId === 'dir'}
        onToggle={() => toggle('dir')}
        onChange={(dir) => onSort({ ...sort, dir })}
      />
    </View>
  );
}
