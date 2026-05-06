import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getUserDetail, UserDetail } from '../../../controllers/adminController';
import { getUserErrands, getUserAcceptedErrands, getUserErrandEvents, getUserMessages, getUserReports } from '../../../models/adminModel';
import VerificationBadge from '../../../view/components/VerificationBadge';

const DEFAULT_AVATAR = require('../../../assets/images/default_profile.jpg');

interface UserErrand {
  id: string;
  title: string;
  status: string;
  created_at: string;
  budget: number | null;
}

interface ActivityItem {
  id: string;
  type: string;
  metadata?: Record<string, any>;
  created_at: string;
}

const EVENT_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  posted: { label: 'Posted an errand', icon: 'paper-plane-outline', color: '#3B82F6' },
  accepted: { label: 'Accepted an errand', icon: 'checkmark-circle-outline', color: '#22C55E' },
  cancelled: { label: 'Cancelled an errand', icon: 'close-circle-outline', color: '#EF4444' },
  marked_done: { label: 'Marked errand as done', icon: 'checkmark-done-outline', color: '#8B5CF6' },
  reviewed: { label: 'Left a review', icon: 'star-outline', color: '#F59E0B' },
  message_sent: { label: 'Sent a message', icon: 'chatbubble-outline', color: '#8B5CF6' },
  reported: { label: 'Reported a user', icon: 'flag-outline', color: '#DC2626' },
};

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);
  const [postedErrands, setPostedErrands] = useState<UserErrand[]>([]);
  const [acceptedErrands, setAcceptedErrands] = useState<UserErrand[]>([]);
  const [events, setEvents] = useState<ActivityItem[]>([]);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    Promise.all([
      getUserDetail(id),
      getUserErrands(id),
      getUserAcceptedErrands(id),
      getUserErrandEvents(id),
      getUserMessages(id),
      getUserReports(id),
    ]).then(([userResult, postedResult, acceptedResult, eventsResult, msgResult, reportsResult]) => {
      if (userResult.success && userResult.data) setUser(userResult.data);
      if (postedResult.data) setPostedErrands(postedResult.data as UserErrand[]);
      if (acceptedResult.data) setAcceptedErrands(acceptedResult.data as UserErrand[]);

      // Merge errand events + messages + reports into a single timeline
      const errandItems: ActivityItem[] = (eventsResult.data ?? []).map((e: any) => ({
        id: e.id,
        type: e.event_type,
        metadata: e.metadata,
        created_at: e.created_at,
      }));
      const msgItems: ActivityItem[] = (msgResult.data ?? []).map((m: any) => ({
        id: m.id,
        type: 'message_sent',
        created_at: m.created_at,
      }));
      const reportItems: ActivityItem[] = (reportsResult.data ?? []).map((r: any) => ({
        id: r.id,
        type: 'reported',
        metadata: { reason: r.reason },
        created_at: r.created_at,
      }));
      const merged = [...errandItems, ...msgItems, ...reportItems].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setEvents(merged);
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
  const cancelledCount = events.filter(e => e.type === 'cancelled').length;

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

        {/* Summary stats */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 12 }}>Summary</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <StatCard label="Posted" count={postedErrands.length} icon="paper-plane-outline" color="#3B82F6" />
            <StatCard label="Accepted" count={acceptedErrands.length} icon="checkmark-circle-outline" color="#22C55E" />
            <StatCard label="Cancelled" count={cancelledCount} icon="close-circle-outline" color="#EF4444" />
            <StatCard label="Done" count={events.filter(e => e.type === 'marked_done').length} icon="checkmark-done-outline" color="#8B5CF6" />
            <StatCard label="Reviews" count={events.filter(e => e.type === 'reviewed').length} icon="star-outline" color="#F59E0B" />
            <StatCard label="Reports" count={events.filter(e => e.type === 'reported').length} icon="flag-outline" color="#DC2626" />
            <StatCard label="Messages" count={messageCount} icon="chatbubble-outline" color="#8B5CF6" />
          </View>
        </View>

        {/* Activity Timeline */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 12 }}>Activity Log</Text>
          {events.length === 0 ? (
            <Text style={{ fontSize: 12, color: '#9CA3AF' }}>No activity yet</Text>
          ) : (
            events.map((event, i) => {
              const config = EVENT_CONFIG[event.type] ?? { label: event.type, icon: 'ellipse-outline', color: '#6B7280' };
              const date = new Date(event.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
              const title = event.metadata?.title || event.metadata?.reason;
              return (
                <View key={event.id} style={{ flexDirection: 'row', gap: 10, paddingVertical: 10, borderBottomWidth: i < events.length - 1 ? 1 : 0, borderBottomColor: '#F9FAFB' }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: config.color + '1A', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={config.icon as any} size={14} color={config.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: '#1F2937' }}>{config.label}</Text>
                    {title && <Text style={{ fontSize: 11, color: '#6B7280' }} numberOfLines={1}>{title}</Text>}
                    <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{date}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
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
