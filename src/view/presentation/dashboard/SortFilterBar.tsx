import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Dropdown from '@/view/components/Dropdown';

export type SortKey = 'deadline' | 'budget' | 'distance';
export type SortDir = 'asc' | 'desc';
export interface SortState { key: SortKey; dir: SortDir; }

interface Props {
  statusOptions: string[];
  statusFilter: string | null;
  onStatusChange: (v: string | null) => void;
  typeFilter: string | null;
  onTypeChange: (v: string | null) => void;
  sort: SortState;
  onSortChange: (s: SortState) => void;
  showDistance: boolean;
}

const TYPE_OPTIONS = ['All', 'Remote', 'Onsite'];
const TYPE_LABELS: Record<string, string> = { All: 'All', Remote: 'Remote', Onsite: 'Onsite' };
const TYPE_ICONS: Record<string, string> = { All: 'apps-outline', Remote: 'cloud-outline', Onsite: 'location-outline' };

const STATUS_ICONS: Record<string, string> = {
  All: 'ellipse', Available: 'ellipse', 'In Progress': 'ellipse', Completed: 'ellipse', Expired: 'ellipse', Cancelled: 'ellipse',
};
const STATUS_COLORS: Record<string, string> = {
  All: '#9CA3AF', Available: '#10B981', 'In Progress': '#F59E0B', Completed: '#10B981', Expired: '#EF4444', Cancelled: '#6B7280',
};

const SORT_LABELS: Record<SortKey, string> = { deadline: 'Deadline', budget: 'Budget', distance: 'Distance' };
const SORT_ICONS: Record<string, string> = { deadline: 'calendar-outline', budget: '₱', distance: 'navigate-outline' };

export default function SortFilterBar({ statusOptions, statusFilter, onStatusChange, typeFilter, onTypeChange, sort, onSortChange, showDistance }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const toggle = (id: string) => setOpenId(prev => prev === id ? null : id);

  const allStatusOptions = ['All', ...statusOptions];
  const statusLabels = Object.fromEntries(allStatusOptions.map(o => [o, o]));
  const sortKeys: SortKey[] = showDistance ? ['deadline', 'budget', 'distance'] : ['deadline', 'budget'];

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 8, zIndex: 10, flexWrap: 'wrap', rowGap: 8 }}>
      <Ionicons name="funnel-outline" size={14} color="#9CA3AF" />
      <Dropdown
        value={statusFilter ?? 'All'}
        options={allStatusOptions}
        labels={statusLabels}
        icon="ellipse"
        icons={STATUS_ICONS}
        iconColors={STATUS_COLORS}
        open={openId === 'status'}
        onToggle={() => toggle('status')}
        onChange={(v) => onStatusChange(v === 'All' ? null : v)}
      />
      <Dropdown
        value={typeFilter ?? 'All'}
        options={TYPE_OPTIONS}
        labels={TYPE_LABELS}
        icon="apps-outline"
        icons={TYPE_ICONS}
        open={openId === 'type'}
        onToggle={() => toggle('type')}
        onChange={(v) => onTypeChange(v === 'All' ? null : v)}
      />
      <View style={{ width: 1, height: 20, backgroundColor: '#E5E7EB' }} />
      <Ionicons name="swap-vertical-outline" size={14} color="#9CA3AF" />
      <Dropdown
        value={sort.key}
        options={sortKeys}
        labels={SORT_LABELS}
        icon="chevron-expand-outline"
        icons={SORT_ICONS}
        open={openId === 'sortKey'}
        onToggle={() => toggle('sortKey')}
        onChange={(key) => onSortChange({ ...sort, key })}
      />
      <TouchableOpacity
        onPress={() => onSortChange({ ...sort, dir: sort.dir === 'asc' ? 'desc' : 'asc' })}
        activeOpacity={0.7}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
      >
        <Ionicons name={sort.dir === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline'} size={13} color="#FEA405" />
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151' }}>{sort.dir === 'asc' ? 'Low → High' : 'High → Low'}</Text>
      </TouchableOpacity>
      {(statusFilter || typeFilter) && (
        <>
          <View style={{ width: 1, height: 20, backgroundColor: '#E5E7EB' }} />
          <TouchableOpacity onPress={() => { onStatusChange(null); onTypeChange(null); }} activeOpacity={0.7} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '600' }}>Clear</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
