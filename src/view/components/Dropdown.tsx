import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props<T extends string> {
  value: T;
  options: T[];
  labels: Record<string, string>;
  icon: string;
  open: boolean;
  onToggle: () => void;
  onChange: (v: T) => void;
}

export default function Dropdown<T extends string>({ value, options, labels, icon, open, onToggle, onChange }: Props<T>) {
  return (
    <View style={{ position: 'relative', zIndex: 10 }}>
      <TouchableOpacity
        onPress={onToggle}
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
              onPress={() => { onChange(opt); onToggle(); }}
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
