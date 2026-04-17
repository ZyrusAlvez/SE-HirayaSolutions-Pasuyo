import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

function Dropdown<T extends string>({
  value, options, labels, icon, onChange,
}: {
  value: T; options: T[]; labels: Record<string, string>; icon: string; onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ position: 'relative', zIndex: 10 }}>
      <TouchableOpacity
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.7}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: open ? '#FEA405' : '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
      >
        <Ionicons name={icon as any} size={13} color="#FEA405" />
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151' }}>{labels[value]}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={12} color="#9CA3AF" />
      </TouchableOpacity>

      {open && (
        <View style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', minWidth: 130, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 6, zIndex: 99 }}>
          {options.map((opt, i) => (
            <TouchableOpacity
              key={opt}
              onPress={() => { onChange(opt); setOpen(false); }}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: i < options.length - 1 ? 1 : 0, borderBottomColor: '#F3F4F6' }}
            >
              <Text style={{ fontSize: 12, color: opt === value ? '#FEA405' : '#374151', fontWeight: opt === value ? '700' : '400' }}>
                {labels[opt]}
              </Text>
              {opt === value && <Ionicons name="checkmark" size={13} color="#FEA405" />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function SortBar({ sort, onSort, keys }: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8, zIndex: 10 }}>
      <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '500' }}>Sort:</Text>
      <Dropdown
        value={sort.key}
        options={keys}
        labels={LABELS}
        icon="grid-outline"
        onChange={(key) => onSort({ ...sort, key })}
      />
      <Dropdown
        value={sort.dir}
        options={['asc', 'desc'] as SortDir[]}
        labels={DIR_LABELS}
        icon={DIR_ICONS[sort.dir]}
        onChange={(dir) => onSort({ ...sort, dir })}
      />
    </View>
  );
}
