import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getUserDetail, UserDetail } from '../../../controllers/adminController';
import { getUserErrands, getUserAcceptedErrands, getUserErrandEvents, getUserMessageCount } from '../../../models/adminModel';
import VerificationBadge from '../../../view/components/VerificationBadge';

const DEFAULT_AVATAR = require('../../../assets/images/default_profile.jpg');

interface UserErrand {
  id: string;
  title: string;
  status: string;
  created_at: string;
  budget: number | null;
}

interface ErrandEvent {
  id: string;
  errand_id: string;
  event_type: string;
  metadata: Record<string, any>;
  created_at: string;
}

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);
  const [postedErrands, setPostedErrands] = useState<UserErrand[]>([]);
  const [acceptedErrands, setAcceptedErrands] = useState<UserErrand[]>([]);
  const [events, setEvents] = useState<ErrandEvent[]>([]);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    Promise.all([
      getUserDetail(id),
      getUserErrands(id),
      getUserAcceptedErrands(id),
      getUserErrandEvents(id),
      getUserMessageCount(id),
    ]).then(([userResult, postedResult, acceptedResult, eventsResult, msgResult]) => {
      if (userResult.success && userResult.data) setUser(userResult.data);
      if (postedResult.data) setPostedErrands(postedResult.data as UserErrand[]);
      if (acceptedResult.data) setAcceptedErrands(acceptedResult.data as UserErrand[]);
      if (eventsResult.data) setEvents(eventsResult.data as ErrandEvent[]);
      setMessageCount(msgResult.count ?? 0);
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#9CA3AF', fontSize: 14 }}>Loading...</Text>
    </View>
  );

  if (!user) return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#9CA3AF', fontSize: 14 }}>User not found</Text>
    </View>
  );

  const joinedDate = new Date(user.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  const cancelledCount = events.filter(e => e.event_type === 'cancelled').length;

  const statusBadgeColor = user.status === 'verified' ? 'bg-green-100' : user.status === 'suspended' ? 'bg-red-100' : user.status === 'pending' ? 'bg-yellow-100' : 'bg-gray-100';
  const statusTextColor = user.status === 'verified' ? 'text-green-700' : user.status === 'suspended' ? 'text-red-500' : user.status === 'pending' ? 'text-yellow-700' : 'text-gray-500';
  const statusLabel = user.status.charAt(0).toUpperCase() + user.status.slice(1);

  return (
    <View style={[{ flex: 1, backgroundColor: '#F9FAFB' }, Platform.OS === 'web' && { maxWidth: 800, width: '100%', alignSelf: 'center' as const }]}>
      <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingTop: Platform.OS !== 'web' ? 48 : 8, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>User Detail</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
        {/* Profile card */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', alignItems: 'center', gap: 8 }}>
          <Image
            source={!avatarError && user.avatar_url ? { uri: user.avatar_url } : DEFAULT_AVATAR}
            onError={() => setAvatarError(true)}
            style={{ width: 72, height: 72, borderRadius: 36 }}
            resizeMode="cover"
          />
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{user.display_name || 'No name set'}</Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <VerificationBadge status={user.status === 'verified' ? 'verified' : user.status === 'pending' ? 'pending' : 'not_verified'} />
            <View className={`px-2 py-1 rounded-full ${statusBadgeColor}`}>
              <Text className={`text-xs font-medium ${statusTextColor}`}>{statusLabel}</Text>
            </View>
          </View>
        </View>

        {/* Account Info */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 }}>Account Info</Text>
          <InfoRow label="Email" value={user.email ?? '—'} />
          <InfoRow label="Role" value={user.role ?? '—'} />
          <InfoRow label="Rating" value={user.rating != null ? `${user.rating.toFixed(1)}` : '—'} />
          <InfoRow label="Joined" value={joinedDate} />
        </View>

        {/* Activity Summary */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 12 }}>Activity</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <StatCard label="Posted" count={postedErrands.length} icon="paper-plane-outline" color="#3B82F6" />
            <StatCard label="Accepted" count={acceptedErrands.length} icon="checkmark-circle-outline" color="#22C55E" />
            <StatCard label="Cancelled" count={cancelledCount} icon="close-circle-outline" color="#EF4444" />
            <StatCard label="Messages" count={messageCount} icon="chatbubble-outline" color="#8B5CF6" />
          </View>
        </View>

        {/* Posted Errands */}
        {postedErrands.length > 0 && (
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 }}>Posted Errands</Text>
            {postedErrands.slice(0, 5).map(e => <ErrandRow key={e.id} errand={e} />)}
            {postedErrands.length > 5 && (
              <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>+{postedErrands.length - 5} more</Text>
            )}
          </View>
        )}

        {/* Accepted Errands */}
        {acceptedErrands.length > 0 && (
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 }}>Accepted Errands</Text>
            {acceptedErrands.slice(0, 5).map(e => <ErrandRow key={e.id} errand={e} />)}
            {acceptedErrands.length > 5 && (
              <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>+{acceptedErrands.length - 5} more</Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' }}>
      <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{label}</Text>
      <Text style={{ fontSize: 12, color: '#1F2937', fontWeight: '500' }}>{value}</Text>
    </View>
  );
}

function StatCard({ label, count, icon, color }: { label: string; count: number; icon: string; color: string }) {
  return (
    <View style={{ flex: 1, minWidth: 70, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon as any} size={18} color={color} />
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>{count}</Text>
      <Text style={{ fontSize: 11, color: '#6B7280' }}>{label}</Text>
    </View>
  );
}

const STATUS_COLORS: Record<string, string> = {
  'Available': '#22C55E',
  'In Progress': '#F59E0B',
  'Completed': '#6B7280',
  'Expired': '#EF4444',
  'Cancelled': '#EF4444',
};

function ErrandRow({ errand }: { errand: UserErrand }) {
  const date = new Date(errand.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F9FAFB', gap: 8 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, fontWeight: '500', color: '#1F2937' }} numberOfLines={1}>{errand.title}</Text>
        <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{date}</Text>
      </View>
      {errand.budget != null && (
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#374151' }}>₱{errand.budget}</Text>
      )}
      <View style={{ backgroundColor: (STATUS_COLORS[errand.status] ?? '#6B7280') + '1A', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
        <Text style={{ fontSize: 10, fontWeight: '600', color: STATUS_COLORS[errand.status] ?? '#6B7280' }}>{errand.status}</Text>
      </View>
    </View>
  );
}
