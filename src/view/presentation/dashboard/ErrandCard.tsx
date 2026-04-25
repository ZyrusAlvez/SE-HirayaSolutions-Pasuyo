import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { DashboardErrand } from '@/controllers/errandController';

const DEFAULT_AVATAR = require('@/assets/images/default_profile.jpg');

const STATUS_COLORS: Record<string, string> = {
  Available: '#10B981',
  'In Progress': '#F59E0B',
  Completed: '#3B82F6',
  Expired: '#EF4444',
  Cancelled: '#6B7280',
};

export default function ErrandCard({ errand }: { errand: DashboardErrand }) {
  const router = useRouter();
  const color = STATUS_COLORS[errand.status] ?? '#6B7280';
  const avatar = errand.poster_avatar && errand.poster_avatar !== 'default'
    ? { uri: errand.poster_avatar }
    : DEFAULT_AVATAR;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/errand/${errand.id}`)}
      style={{
        backgroundColor: 'white', borderRadius: 14, padding: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <Image source={avatar} style={{ width: 28, height: 28, borderRadius: 14 }} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }} numberOfLines={1}>
            {errand.poster_name ?? 'Unknown'}
          </Text>
        </View>
        <View style={{ backgroundColor: color + '1A', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color }}>{errand.status}</Text>
        </View>
      </View>

      <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 }} numberOfLines={1}>{errand.title}</Text>
      <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 18 }} numberOfLines={2}>{errand.description}</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name={errand.is_remote ? 'cloud-outline' : 'location-outline'} size={13} color="#9CA3AF" />
          <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '500' }}>{errand.is_remote ? 'Remote' : 'Onsite'}</Text>
        </View>
        {errand.budget != null && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#D97706' }}>₱{errand.budget.toLocaleString()}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
