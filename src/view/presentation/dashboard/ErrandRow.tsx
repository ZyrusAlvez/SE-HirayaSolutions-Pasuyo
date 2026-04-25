import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { DashboardErrand } from '@/controllers/errandController';
import { toast } from '@/utils/toast';
import KebabMenu from '@/view/components/KebabMenu';
import type { KebabAction } from '@/view/components/KebabMenu';

const DEFAULT_AVATAR = require('@/assets/images/default_profile.jpg');

const STATUS_COLORS: Record<string, string> = {
  Available: '#10B981',
  'In Progress': '#F59E0B',
  Completed: '#3B82F6',
  Expired: '#EF4444',
  Cancelled: '#6B7280',
};

export default function ErrandRow({ errand, search = '', tab = 'posted' }: { errand: DashboardErrand; search?: string; tab?: string }) {
  const router = useRouter();
  const color = STATUS_COLORS[errand.status] ?? '#6B7280';
  const avatar = errand.poster_avatar && errand.poster_avatar !== 'default'
    ? { uri: errand.poster_avatar }
    : DEFAULT_AVATAR;

  const postedActions: KebabAction[] = [
    { label: 'Edit', icon: 'create-outline', onPress: () => {
      if (errand.status === 'In Progress') { toast({ title: 'This errand has already been accepted and cannot be edited.', preset: 'error' }); return; }
      router.push(`/errand/${errand.id}?edit=true`);
    }},
    { label: 'Delete', icon: 'trash-outline', onPress: () => {} },
    { label: 'Share', icon: 'share-outline', onPress: () => {} },
  ];

  const acceptedActions: KebabAction[] = [
    { label: 'Mark as Done', icon: 'checkmark-circle-outline', onPress: () => {} },
    { label: `Chat with ${errand.poster_name ?? 'Client'}`, icon: 'chatbubble-outline', onPress: () => {} },
    { label: 'Cancel Errand', icon: 'close-circle-outline', onPress: () => {} },
    { label: 'Share', icon: 'share-outline', onPress: () => {} },
  ];

  const actions = tab === 'posted' ? postedActions : acceptedActions;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/errand/${errand.id}`)}
      style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}
    >
      {/* Avatar */}
      <Image source={avatar} style={{ width: 32, height: 32, borderRadius: 16 }} />

      {/* Content */}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }} numberOfLines={1}>{errand.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 11, color: '#6B7280' }} numberOfLines={1}>{errand.poster_name ?? 'Unknown'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, height: 14, justifyContent: 'center' }}>
            <View style={{ width: 12, height: 12, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={errand.is_remote ? 'cloud-outline' : 'location-outline'} size={10} color="#9CA3AF" />
            </View>
            <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '500' }}>{errand.is_remote ? 'Remote' : 'Onsite'}</Text>
          </View>
          {errand.budget != null && (
            <Text style={{ fontSize: 10, fontWeight: '600', color: '#D97706' }}>₱{errand.budget.toLocaleString()}</Text>
          )}
        </View>
      </View>

      {/* Status + kebab */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ backgroundColor: color + '1A', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color }}>{errand.status}</Text>
        </View>
        <KebabMenu actions={actions} />
      </View>
    </TouchableOpacity>
  );
}
