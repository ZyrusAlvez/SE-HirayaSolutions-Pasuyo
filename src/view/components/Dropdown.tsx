import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props<T extends string> {
  value: T;
  options: T[];
  labels: Record<string, string>;
  icon: string;
  iconColor?: string;
  icons?: Record<string, string>;
  iconColors?: Record<string, string>;
  open: boolean;
  onToggle: () => void;
  onChange: (v: T) => void;
  testID?: string;
}

export default function Dropdown<T extends string>({ value, options, labels, icon, iconColor = '#FEA405', icons, iconColors, open, onToggle, onChange, testID }: Props<T>) {
  const activeIcon = icons?.[value] ?? icon;
  const activeColor = iconColors?.[value] ?? iconColor;

  return (
    <View style={{ position: 'relative', zIndex: open ? 999 : 1 }}>
      <TouchableOpacity
        testID={testID}
        onPress={onToggle}
        activeOpacity={0.7}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: open ? '#FEA405' : '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
      >
        <View style={{ width: 16, alignItems: 'center' }}>
          {activeIcon.length <= 2
            ? <Text style={{ fontSize: 13, fontWeight: '700', color: activeColor }}>{activeIcon}</Text>
            : <Ionicons name={activeIcon as any} size={13} color={activeColor} />}
        </View>
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151' }}>{labels[value]}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={12} color="#9CA3AF" />
      </TouchableOpacity>

      {open && (
        <View style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', minWidth: 130, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 6, zIndex: 9999 }}>
          {options.map((opt, i) => {
            const optIcon = icons?.[opt];
            const optColor = iconColors?.[opt] ?? '#374151';
            const isActive = opt === value;
            return (
              <TouchableOpacity
                key={opt}
                testID={testID ? `${testID}-option-${opt.toLowerCase().replace(/\s+/g, '-')}` : undefined}
                onPress={() => { onChange(opt); onToggle(); }}
                activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: i < options.length - 1 ? 1 : 0, borderBottomColor: '#F3F4F6' }}
              >
                {optIcon && <View style={{ width: 16, alignItems: 'center' }}>
                  {optIcon.length <= 2
                    ? <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? '#FEA405' : optColor }}>{optIcon}</Text>
                    : <Ionicons name={optIcon as any} size={12} color={isActive ? '#FEA405' : optColor} />}
                </View>}
                <Text style={{ flex: 1, fontSize: 12, color: isActive ? '#FEA405' : '#374151', fontWeight: isActive ? '700' : '400' }}>
                  {labels[opt]}
                </Text>
                {isActive && <Ionicons name="checkmark" size={13} color="#FEA405" />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}
