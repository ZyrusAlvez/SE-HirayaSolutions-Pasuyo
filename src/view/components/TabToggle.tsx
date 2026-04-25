import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface Tab {
  key: string;
  label: string;
  icon: string;
}

interface Props {
  tabs: Tab[];
  activeKey: string;
  onTabChange: (key: string) => void;
}

export default function TabToggle({ tabs, activeKey, onTabChange }: Props) {
  return (
    <View style={{ flexDirection: 'row', marginHorizontal: 24, marginTop: 16, marginBottom: 8, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4 }}>
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.8}
            style={{
              flex: 1, paddingVertical: 8, borderRadius: 8,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
              backgroundColor: active ? 'white' : 'transparent',
              shadowColor: active ? '#000' : 'transparent',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: active ? 0.08 : 0,
              shadowRadius: 2,
              elevation: active ? 2 : 0,
            }}
          >
            <Ionicons name={tab.icon as any} size={15} color={active ? '#111827' : '#9CA3AF'} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#111827' : '#9CA3AF' }}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
