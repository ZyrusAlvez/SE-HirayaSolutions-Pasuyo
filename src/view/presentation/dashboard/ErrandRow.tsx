import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { DashboardErrand } from '@/controllers/errandController';
import HighlightText from '@/view/components/HighlightText';

const DEFAULT_AVATAR = require('@/assets/images/default_profile.jpg');

const STATUS_COLORS: Record<string, string> = {
  Available: '#10B981',
  'In Progress': '#F59E0B',
  Completed: '#3B82F6',
  Expired: '#EF4444',
  Cancelled: '#6B7280',
};

export default function ErrandRow({ errand, search = '' }: { errand: DashboardErrand; search?: string }) {
  const router = useRouter();
  const color = STATUS_COLORS[errand.status] ?? '#6B7280';
  const avatar = errand.poster_avatar && errand.poster_avatar !== 'default'
    ? { uri: errand.poster_avatar }
    : DEFAULT_AVATAR;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/errand/${errand.id}`)}
      style={{ flexDirection: 'row', padding: 12, gap: 10 }}
    >
      <Image source={avatar} style={{ width: 36, height: 36, borderRadius: 18, marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <HighlightText text={errand.poster_name ?? 'Unknown'} query={search} style={{ fontSize: 12, fontWeight: '600', color: '#374151' }} numberOfLines={1} />
          <View style={{ backgroundColor: color + '1A', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color }}>{errand.status}</Text>
          </View>
        </View>
        <HighlightText text={errand.title} query={search} style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 2 }} numberOfLines={1} />
        <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 17, marginTop: 2 }} numberOfLines={1}>{errand.description}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name={errand.is_remote ? 'cloud-outline' : 'location-outline'} size={11} color="#9CA3AF" />
            <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '500' }}>{errand.is_remote ? 'Remote' : 'Onsite'}</Text>
          </View>
          {errand.budget != null && (
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#D97706' }}>₱{errand.budget.toLocaleString()}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
