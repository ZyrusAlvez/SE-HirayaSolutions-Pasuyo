import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getUserDetail, getUserActivity, getAdminUnpaidTotal, getUserReportsAgainst } from '@/controllers/adminController';
import type { ActivityItem, ErrandReport } from '@/controllers/adminController';
import VerificationBadge from '@/view/components/VerificationBadge';
import ImageViewer from '@/view/components/ImageViewer';
import Dropdown from '@/view/components/Dropdown';
import UserDetailSkeleton from '@/view/presentation/admin/UserDetailSkeleton';
import ServiceFeeLimitBar from '@/view/components/ServiceFeeLimitBar';

const DEFAULT_AVATAR = require('@/assets/images/default_profile.jpg');
const ACCENT = '#FEA405';

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

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);
  const [events, setEvents] = useState<ActivityItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('All');
  const [sort, setSort] = useState<SortKey>('newest');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [unpaidTotal, setUnpaidTotal] = useState<number | null>(null);
  const [reports, setReports] = useState<ErrandReport[]>([]);

  const loadActivity = useCallback(async (pageNum: number, reset: boolean) => {
    if (!id) return;
    if (!reset) setLoadingMore(true);
    const result = await getUserActivity(id, pageNum, filter);
    if (result.success && result.data) {
      let items = result.data.items;
      if (sort === 'oldest') items = [...items].reverse();
      setEvents(prev => reset ? items : [...prev, ...items]);
      setHasMore(result.data.hasMore);
      setPage(pageNum);
    }
    setLoadingMore(false);
  }, [id, filter, sort]);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    getUserDetail(id).then(result => {
      if (result.success && result.data) setUser(result.data);
      setLoading(false);
    });
    getAdminUnpaidTotal(id).then(result => {
      if (result.success) setUnpaidTotal(result.data);
    });
    getUserReportsAgainst(id).then(result => {
      if (result.success) setReports(result.data);
    });
  }, [id]);

  useEffect(() => {
    loadActivity(0, true);
  }, [filter, sort]);

  const loadMore = () => {
    if (!loadingMore && hasMore) loadActivity(page + 1, false);
  };

  const toggle = (dropdownId: string) => setOpenDropdown(prev => prev === dropdownId ? null : dropdownId);

  if (loading) return (
    <View style={[{ flex: 1, backgroundColor: '#F9FAFB' }, Platform.OS === 'web' && { maxWidth: 1000, width: '100%', alignSelf: 'center' as const }]}>
      <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingTop: Platform.OS !== 'web' ? 48 : 8, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>User Detail</Text>
      </View>
      <UserDetailSkeleton />
    </View>
  );

  if (!user) return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#9CA3AF', fontSize: 14 }}>User not found</Text>
    </View>
  );

  const verifiedName = [user.first_name, user.last_name].filter(Boolean).join(' ');
  const fullName = user.status === 'verified' && verifiedName ? verifiedName : (user.displayName || verifiedName || 'No name set');
  const fullLegalName = [user.first_name, user.middle_name, user.last_name, user.suffix].filter(Boolean).join(' ');
  const joinedDate = new Date(user.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  const lastSeen = user.last_seen ? new Date(user.last_seen).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const address = [user.address_house_no, user.address_building, user.address_unit && `Unit ${user.address_unit}`, user.address_floor && `Floor ${user.address_floor}`, user.address_street, user.address_barangay, user.address_city, user.address_province].filter(Boolean).join(', ') || '—';

  const docImages: { uri: string; fileName: string }[] = [];
  if (user.id_front_url) docImages.push({ uri: user.id_front_url, fileName: 'ID Front' });
  if (user.id_back_url) docImages.push({ uri: user.id_back_url, fileName: 'ID Back' });
  if (user.utility_bill_front_url) docImages.push({ uri: user.utility_bill_front_url, fileName: 'Bill Front' });
  if (user.utility_bill_back_url) docImages.push({ uri: user.utility_bill_back_url, fileName: 'Bill Back' });

  return (
    <View style={[{ flex: 1, backgroundColor: '#F9FAFB' }, Platform.OS === 'web' && { maxWidth: 1000, width: '100%', alignSelf: 'center' as const }]}>
      <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingTop: Platform.OS !== 'web' ? 48 : 8, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>User Detail</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: 32 }}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 100 && hasMore && !loadingMore) {
            loadMore();
          }
        }}
        scrollEventThrottle={400}
      >
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
            {fullLegalName && <InfoRow label="Full Name" value={fullLegalName} />}
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

          {unpaidTotal != null && (
            <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 }}>
              <ServiceFeeLimitBar totalFees={unpaidTotal} isVerified={user.status === 'verified'} isAdmin />
            </View>
          )}

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

        {/* Reports Against User */}
        {reports.length > 0 && (
          <View style={{ margin: 16, marginBottom: 0, backgroundColor: 'white', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#F3F4F6' }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 16 }}>Reports ({reports.length})</Text>
            {reports.map((report, i) => (
              <View key={report.id} style={{ flexDirection: 'row', gap: 10, paddingBottom: i < reports.length - 1 ? 14 : 0, marginBottom: i < reports.length - 1 ? 14 : 0, borderBottomWidth: i < reports.length - 1 ? 1 : 0, borderBottomColor: '#F3F4F6' }}>
                <TouchableOpacity onPress={() => router.push(`/admin/account/${report.reporter_id}`)} activeOpacity={0.7}>
                  <Image
                    source={report.reporter_avatar ? { uri: report.reporter_avatar } : DEFAULT_AVATAR}
                    style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6' }}
                  />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <TouchableOpacity onPress={() => router.push(`/admin/account/${report.reporter_id}`)} activeOpacity={0.7}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>{report.reporter_name}</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 12, color: '#374151', marginTop: 2 }}>{report.reason}</Text>
                  {report.details && (
                    <Text style={{ fontSize: 11, color: '#6B7280', fontStyle: 'italic', marginTop: 2 }} numberOfLines={2}>"{report.details}"</Text>
                  )}
                  <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>
                    {new Date(report.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Section 2: Activity Log */}
        <View style={{ marginTop: 16, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', rowGap: 8, marginBottom: 16, zIndex: 100 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151' }}>Activity Log</Text>
            <View style={{ width: 1, height: 16, backgroundColor: '#E5E7EB', marginHorizontal: 4 }} />
            <Ionicons name="funnel-outline" size={14} color="#9CA3AF" />
            <Dropdown value={filter} options={FILTER_OPTIONS} labels={FILTER_LABELS} icon="apps-outline" icons={FILTER_ICONS} iconColors={FILTER_COLORS} open={openDropdown === 'filter'} onToggle={() => toggle('filter')} onChange={(v) => setFilter(v as FilterKey)} />
            <Ionicons name="swap-vertical-outline" size={14} color="#9CA3AF" />
            <Dropdown value={sort} options={SORT_OPTIONS} labels={SORT_LABELS} icon="time-outline" icons={SORT_ICONS} open={openDropdown === 'sort'} onToggle={() => toggle('sort')} onChange={(v) => setSort(v as SortKey)} />
            {filter !== 'All' && (
              <TouchableOpacity onPress={() => setFilter('All')} activeOpacity={0.7} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '600' }}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {events.length === 0 && !loadingMore ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
              <Ionicons name="pulse-outline" size={36} color="#E5E7EB" />
              <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 8 }}>No activity found</Text>
            </View>
          ) : (
            <View style={{ gap: 6 }}>
              {events.map(event => <ActivityRow key={event.id} event={event} />)}
              {loadingMore && (
                <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={ACCENT} />
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

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
  const hasDetail = !!(title || changes);

  return (
    <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', alignItems: hasDetail ? 'flex-start' : 'center' }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: config.color + '1A', alignItems: 'center', justifyContent: 'center' }}>
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
      </View>
      <Text style={{ fontSize: 10, color: '#9CA3AF', alignSelf: 'center' }}>{date}</Text>
    </View>
  );
}
