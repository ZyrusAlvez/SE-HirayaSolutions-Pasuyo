import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';

const TABS = [
  { label: 'Accounts', icon: 'people-outline', route: '/admin/accounts' },
  { label: 'Errands', icon: 'list-outline', route: '/admin/errands' },
] as const;

const ACCENT = '#FEA405';

export default function AdminNavBar() {
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = '/' + segments.join('/');

  return (
    <View className={`bg-white px-6 flex-row justify-around border-t border-gray-100 ${Platform.OS === 'web' ? 'py-2' : 'py-4'}`}>
      {TABS.map(tab => {
        const active = currentRoute === tab.route;
        return (
          <TouchableOpacity
            key={tab.route}
            className="items-center"
            activeOpacity={0.7}
            onPress={() => router.push(tab.route)}
          >
            <Ionicons name={tab.icon as any} size={24} color={active ? ACCENT : '#9CA3AF'} />
            <Text className={`text-xs mt-1 ${active ? 'text-[#FEA405] font-semibold' : 'text-gray-400'}`}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
