import { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getUserDetail } from '../../../controllers/adminController';
import { getUserErrandEvents, getUserMessages, getUserReports } from '../../../models/adminModel';
import VerificationBadge from '../../../view/components/VerificationBadge';
import ImageViewer from '../../../view/components/ImageViewer';
import Dropdown from '../../../view/components/Dropdown';

const DEFAULT_AVATAR = require('../../../assets/images/default_profile.jpg');

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
  edited_errand: { label: 'Edited an errand', icon: 'create-outline', color: '#F59E0B' },
  deleted_errand: { label: 'Deleted an errand', icon: 'trash-outline', color: '#EF4444' },
};

type FilterKey = 'All' | 'Activity' | 'Messages' | 'Reports';
type SortKey = 'newest' | 'oldest';

const FILTER_OPTIONS: FilterKey[] = ['All', 'Activity', 'Messages', 'Reports'];
const FILTER_LABELS: Record<string, string> = { All: 'All', Activity: 'Activity', Messages: 'Messages', Reports: 'Reports' };
const FILTER_ICONS: Record<string, string> = { All: 'apps-outline', Activity: 'pulse-outline', Messages: 'chatbubble-outline', Reports: 'flag-outline' };
const FILTER_COLORS: Record<string, string> = { All: '#6B7280', Activity: '#3B82F6', Messages: '#8B5CF6', Reports: '#DC2626' };

const SORT_OPTIONS: SortKey[] = ['newest', 'oldest'];
const SORT_LABELS: Record<string, string> = { newest: 'Newest', oldest: 'Oldest' };
const SORT_ICONS: Record<string, string> = { newest: 'arrow-down-outline', oldest: 'arrow-up-outline' };

const ACTIVITY_TYPES = ['posted', 'accepted', 'cancelled', 'marked_done', 'reviewed', 'edited_errand', 'deleted_errand'];

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);
  const [events, setEvents] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState<FilterKey>('All');
  const [sort, setSort] = useState<SortKey>('newest');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    Promise.all([
      getUserDetail(id),
      getUserErrandEvents(id),
      getUserMessages(id),
      getUserReports(id),
    ]).then(([userResult, eventsResult, msgResult, reportsResult]) => {
      if (userResult.success && userResult.data) setUser(userResult.data);

      const errandItems: ActivityItem[] = (eventsResult.data ?? []).map((e: any) => ({
        id: e.id, type: e.event_type, metadata: e.metadata, created_at: e.created_at,
      }));
      const msgItems: ActivityItem[] = (msgResult.data ?? []).map((m: any) => ({
        id: m.id, type: 'message_sent', created_at: m.created_at,
      }));
      const reportItems: ActivityItem[] = (reportsResult.data ?? []).map((r: any) => ({
        id: r.id, type: 'reported', metadata: { reason: r.reason }, created_at: r.created_at,
      }));
      setEvents([...errandItems, ...msgItems, ...reportItems]);
      setLoading(false);
    });
  }, [id]);

  const filtered = useMemo(() => {
    let list = [...events];
    switch (filter) {
      case 'Activity': list = list.filter(e => ACTIVITY_TYPES.includes(e.type)); break;
      case 'Messages': list = list.filter(e => e.type === 'message_sent'); break;
      case 'Reports': list = list.filter(e => e.type === 'reported'); break;
    }
    list.sort((a, b) => sort === 'newest'
      ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    return list;
  }, [events, filter, sort]);

  const toggle = (dropdownId: string) => setOpenDropdown(prev => prev === dropdownId ? null : dropdownId);

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

  const fullName = [user.first_name, user.middle_name, user.last_name, user.suffix].filter(Boolean).join(' ') || 'No name set';
  const joinedDate = new Date(user.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  const lastSeen = user.last_seen ? new Date(user.last_seen).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const address = [user.address_house_no, user.address_building, user.address_unit && `Unit ${user.address_unit}`, user.address_floor && `Floor ${user.address_floor}`, user.address_street, user.address_barangay, user.address_city, user.address_province].filter(Boolean).join(', ') || '—';

  // Collect document images for viewer
  const docImages: { uri: string; fileName: string }[] = [];
  if (user.id_front_url) docImages.push({ uri: user.id_front_url, fileName: 'ID Front' });
  if (user.id_back_url) docImages.push({ uri: user.id_back_url, fileName: 'ID Back' });
  if (user.utility_bill_front_url) docImages.push({ uri: user.utility_bill_front_url, fileName: 'Bill Front' });
  if (user.utility_bill_back_url) docImages.push({ uri: user.utility_bill_back_url, fileName: 'Bill Back' });

  return (
    <View style={[{ flex: 1, backgroundColor: '#F9FAFB' }, Platform.OS === 'web' && { maxWidth: 1000, width: '100%', alignSelf: 'center' as const }]}>
      {/* Top bar */}
      <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingTop: Platform.OS !== 'web' ? 48 : 8, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>User Detail</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Section 1: Full User Information */}
        <View style={{ backgroundColor: 'white', margin: 16, marginBottom: 0, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#F3F4F6' }}>
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
            <Image
              source={!avatarError && user.avatar_url ? { uri: user.avatar_url } : DEFAULT_AVATAR}
              onError={() => setAvatarError(true)}
              style={{ width: 64, height: 64, borderRadius: 32 }}
              resizeMode="cover"
            />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{fullName}</Text>
              <Text style={{ fontSize: 13, color: '#6B7280' }}>{user.email ?? '—'}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, alignItems: 'center' }}>
                <VerificationBadge status={user.status === 'verified' ? 'verified' : user.status === 'pending' ? 'pending' : 'not_verified'} />
              </View>
            </View>
          </View>

          <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12, gap: 6 }}>
            <InfoRow label="Status" value={user.status.charAt(0).toUpperCase() + user.status.slice(1)} />
            <InfoRow label="Rating (runner)" value={user.rating != null ? Number(user.rating).toFixed(1) : '—'} />
            <InfoRow label="Gender" value={user.gender ?? '—'} />
            <InfoRow label="Date of Birth" value={user.date_of_birth ?? '—'} />
            <InfoRow label="Address" value={address} />
            <InfoRow label="Joined" value={joinedDate} />
            <InfoRow label="Last Seen" value={lastSeen} />
            {user.id_type && <InfoRow label="ID Type" value={user.id_type} />}
            {user.utility_bill_type && <InfoRow label="Utility Bill" value={user.utility_bill_type} />}
            {user.verification_submitted_at && <InfoRow label="Verification Submitted" value={new Date(user.verification_submitted_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })} />}
          </View>

          {docImages.length > 0 && (
            <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Documents</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {docImages.map((doc, i) => (
                  <TouchableOpacity key={doc.fileName} onPress={() => setViewerIndex(i)} activeOpacity={0.8}>
                    <Image source={{ uri: doc.uri }} style={{ width: 100, height: 70, borderRadius: 8, backgroundColor: '#F3F4F6' }} resizeMode="cover" />
                    <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2, textAlign: 'center' }}>{doc.fileName}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Section 2: Activity Log */}
        <View style={{ marginTop: 16, paddingHorizontal: 16 }}>
          {/* Filter & Sort */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', rowGap: 8, marginBottom: 12, zIndex: 100 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151' }}>Activity Log</Text>
            <View style={{ width: 1, height: 16, backgroundColor: '#E5E7EB', marginHorizontal: 4 }} />
            <Ionicons name="funnel-outline" size={14} color="#9CA3AF" />
            <Dropdown
              value={filter}
              options={FILTER_OPTIONS}
              labels={FILTER_LABELS}
              icon="apps-outline"
              icons={FILTER_ICONS}
              iconColors={FILTER_COLORS}
              open={openDropdown === 'filter'}
              onToggle={() => toggle('filter')}
              onChange={(v) => setFilter(v as FilterKey)}
            />
            <Ionicons name="swap-vertical-outline" size={14} color="#9CA3AF" />
            <Dropdown
              value={sort}
              options={SORT_OPTIONS}
              labels={SORT_LABELS}
              icon="time-outline"
              icons={SORT_ICONS}
              open={openDropdown === 'sort'}
              onToggle={() => toggle('sort')}
              onChange={(v) => setSort(v as SortKey)}
            />
            {filter !== 'All' && (
              <TouchableOpacity onPress={() => setFilter('All')} activeOpacity={0.7} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '600' }}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Activity items */}
          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
              <Ionicons name="pulse-outline" size={36} color="#E5E7EB" />
              <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 8 }}>No activity found</Text>
            </View>
          ) : (
            <View style={{ gap: 6 }}>
              {filtered.map(event => <ActivityRow key={event.id} event={event} />)}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Image Viewer */}
      <ImageViewer
        images={docImages}
        activeIndex={viewerIndex}
        onClose={() => setViewerIndex(null)}
        onIndexChange={setViewerIndex}
      />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 4 }}>
      <Text style={{ fontSize: 12, color: '#9CA3AF', minWidth: 140 }}>{label}</Text>
      <Text style={{ fontSize: 12, color: '#1F2937', fontWeight: '500', flex: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

function ActivityRow({ event }: { event: ActivityItem }) {
  const config = EVENT_CONFIG[event.type] ?? { label: event.type, icon: 'ellipse-outline', color: '#6B7280' };
  const date = new Date(event.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const title = event.metadata?.title || event.metadata?.reason;
  const changes = event.metadata?.changes as Record<string, { from: any; to: any }> | undefined;

  return (
    <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6' }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: config.color + '1A', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
        <Ionicons name={config.icon as any} size={14} color={config.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, fontWeight: '500', color: '#1F2937' }}>{config.label}</Text>
        {title && <Text style={{ fontSize: 11, color: '#6B7280' }} numberOfLines={1}>{title}</Text>}
        {changes && Object.entries(changes).map(([key, { from, to }]) => (
          <Text key={key} style={{ fontSize: 10, color: '#9CA3AF' }}>
            {key}: "{from ?? '—'}" → "{to ?? '—'}"
          </Text>
        ))}
        <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{date}</Text>
      </View>
    </View>
  );
}
