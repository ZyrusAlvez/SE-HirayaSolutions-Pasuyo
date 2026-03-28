import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';

const TABS = [
  { label: 'Accounts',  icon: 'people-outline',       route: '/admin/accounts'  },
  { label: 'Errands',   icon: 'list-outline',          route: '/admin/errands'   },
  { label: 'Analytics', icon: 'bar-chart-outline',     route: '/admin/analytics' },
  { label: 'Logs',      icon: 'document-text-outline', route: '/admin/logs'      },
] as const;

const ACCENT = '#FEA405';

export default function AdminNavBar() {
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = '/' + segments.join('/');

  return (
    <View style={{ backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#F3F4F6', flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 8, paddingVertical: Platform.OS === 'web' ? 8 : 16 }}>
      {TABS.map(tab => {
        const active = currentRoute === tab.route;
        return (
          <TouchableOpacity
            key={tab.route}
            style={{ alignItems: 'center', flex: 1 }}
            activeOpacity={0.7}
            onPress={() => router.push(tab.route)}
          >
            <Ionicons name={tab.icon as any} size={22} color={active ? ACCENT : '#9CA3AF'} />
            <Text style={{ fontSize: 10, marginTop: 3, color: active ? ACCENT : '#9CA3AF', fontWeight: active ? '600' : '400' }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
