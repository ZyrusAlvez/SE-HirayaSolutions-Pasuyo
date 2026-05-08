import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAdminErrandDetail, getAdminErrandHistory, getErrandReports } from '@/controllers/adminController';
import type { AdminErrandEvent, ErrandReport } from '@/controllers/adminController';
import ImageViewer from '@/view/components/ImageViewer';

const ACCENT = '#FEA405';

function Bone({ width, height, radius = 6 }: { width: number | string; height: number; radius?: number }) {
  return <View style={{ width: width as any, height, borderRadius: radius, backgroundColor: '#E5E7EB' }} />;
}

const STATUS_COLORS: Record<string, string> = {
  Available: '#10B981',
  'In Progress': '#F59E0B',
  Completed: '#10B981',
  Expired: '#EF4444',
};

const EVENT_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  posted: { icon: 'add-circle', color: '#6366F1', label: 'Posted errand' },
  edited_errand: { icon: 'create', color: '#F59E0B', label: 'Edited errand' },
  deleted_errand: { icon: 'trash', color: '#EF4444', label: 'Deleted errand' },
  accepted: { icon: 'checkmark-circle', color: '#10B981', label: 'Accepted errand' },
  cancelled: { icon: 'close-circle', color: '#EF4444', label: 'Cancelled errand' },
  marked_done: { icon: 'flag', color: '#3B82F6', label: 'Marked as done' },
  reviewed: { icon: 'star', color: '#F59E0B', label: 'Left a review' },
  service_fee_paid: { icon: 'cash', color: '#8B5CF6', label: 'Service fee paid' },
};

function EventRow({ event, actorName, isLast }: { event: AdminErrandEvent; actorName: string; isLast: boolean }) {
  const config = EVENT_CONFIG[event.event_type] ?? { icon: 'ellipse', color: '#9CA3AF', label: event.event_type };
  const date = new Date(event.created_at);
  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' · ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ alignItems: 'center', width: 24 }}>
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: config.color + '1A', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={config.icon} size={14} color={config.color} />
        </View>
        {!isLast && <View style={{ width: 2, flex: 1, backgroundColor: '#E5E7EB', marginVertical: 4 }} />}
      </View>
      <View style={{ flex: 1, paddingBottom: isLast ? 0 : 20 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>{config.label}</Text>
        <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{actorName}</Text>
        {event.metadata?.title && (
          <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }} numberOfLines={1}>{event.metadata.title}</Text>
        )}
        {event.event_type === 'edited_errand' && event.metadata?.changes && (
          <View style={{ marginTop: 4 }}>
            {Object.entries(event.metadata.changes as Record<string, { from: any; to: any }>).map(([key, { from, to }]) => (
              <Text key={key} style={{ fontSize: 10, color: '#9CA3AF' }}>
                {key}: "{from ?? '—'}" → "{to ?? '—'}"
              </Text>
            ))}
          </View>
        )}
        {event.event_type === 'cancelled' && event.metadata?.reason && (
          <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>Reason: {event.metadata.reason}</Text>
        )}
        {event.event_type === 'reviewed' && event.metadata?.rating && (
          <View style={{ marginTop: 4, gap: 4 }}>
            <View style={{ flexDirection: 'row', gap: 2 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <Ionicons key={i} name={i <= event.metadata.rating ? 'star' : 'star-outline'} size={12} color={i <= event.metadata.rating ? '#FEA405' : '#D1D5DB'} />
              ))}
            </View>
            {event.metadata.feedback && (
              <Text style={{ fontSize: 11, color: '#6B7280', fontStyle: 'italic' }}>"{event.metadata.feedback}"</Text>
            )}
          </View>
        )}
        <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{formatted}</Text>
      </View>
    </View>
  );
}

export default function AdminErrandDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const [errand, setErrand] = useState<any>(null);
  const [events, setEvents] = useState<AdminErrandEvent[]>([]);
  const [actorNames, setActorNames] = useState<Record<string, string>>({});
  const [reports, setReports] = useState<ErrandReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getAdminErrandDetail(id),
      getAdminErrandHistory(id),
      getErrandReports(id),
    ]).then(([errandResult, historyResult, reportsResult]) => {
      if (errandResult.success) setErrand(errandResult.data);
      if (historyResult.success) {
        setEvents(historyResult.data.events);
        setActorNames(historyResult.data.actorNames);
      }
      if (reportsResult.success) setReports(reportsResult.data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <View style={[{ flex: 1, backgroundColor: '#F9FAFB' }, Platform.OS === 'web' && { maxWidth: 1200, width: '100%', alignSelf: 'center' as const }]}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View style={{ alignSelf: 'center', width: '100%', maxWidth: width >= 768 ? 680 : undefined }}>
            <Bone width={140} height={16} radius={8} />
            <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 20, marginTop: 16, gap: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Bone width="60%" height={20} />
                <Bone width={70} height={22} radius={11} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Bone width={28} height={28} radius={14} />
                <Bone width={120} height={12} />
              </View>
              <Bone width="100%" height={1} />
              <Bone width={80} height={10} />
              <Bone width="100%" height={14} />
              <Bone width="90%" height={14} />
              <Bone width="70%" height={14} />
              <Bone width="100%" height={1} />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Bone width={50} height={10} />
                  <Bone width={80} height={16} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Bone width={60} height={10} />
                  <Bone width={100} height={16} />
                </View>
              </View>
              <Bone width="100%" height={1} />
              <Bone width={40} height={10} />
              <Bone width={80} height={14} />
            </View>
            <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 20, marginTop: 16, gap: 12 }}>
              <Bone width={80} height={16} />
              {[1, 2, 3].map(i => (
                <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                  <Bone width={24} height={24} radius={12} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Bone width="50%" height={13} />
                    <Bone width="30%" height={11} />
                    <Bone width="40%" height={11} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!errand) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="alert-circle-outline" size={48} color="#E5E7EB" />
        <Text style={{ color: '#9CA3AF', marginTop: 8 }}>Errand not found</Text>
      </View>
    );
  }

  const status = errand.status === 'Available' && errand.deadline && new Date(errand.deadline) < new Date() ? 'Expired' : errand.status;
  const badgeColor = STATUS_COLORS[status] ?? '#6B7280';
  const images: string[] = errand.images ?? [];

  return (
    <View style={[{ flex: 1, backgroundColor: '#F9FAFB' }, Platform.OS === 'web' && { maxWidth: 1200, width: '100%', alignSelf: 'center' as const }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={{ alignSelf: 'center', width: '100%', maxWidth: width >= 768 ? 680 : undefined }}>
          {/* Back button */}
          <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 }}>
            <Ionicons name="arrow-back" size={18} color="#6B7280" />
            <Text style={{ fontSize: 13, color: '#6B7280' }}>Back to Errands</Text>
          </TouchableOpacity>

          {/* Errand Detail Card */}
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827', flex: 1 }}>{errand.title}</Text>
              <View style={{ backgroundColor: badgeColor + '1A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: badgeColor }}>{status}</Text>
              </View>
            </View>

            <TouchableOpacity onPress={() => router.push(`/admin/account/${errand.user_id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }} activeOpacity={0.7}>
              <Image
                source={errand.poster_avatar ? { uri: errand.poster_avatar } : require('@/assets/images/default_profile.jpg')}
                style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F4F6' }}
              />
              <Text style={{ fontSize: 12, color: '#6B7280' }}>Posted by <Text style={{ fontWeight: '600', color: '#374151' }}>{errand.poster_name ?? 'Unknown'}</Text></Text>
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 }} />

            <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Description</Text>
            <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>{errand.description}</Text>

            {(errand.budget != null || errand.deadline) && (
              <>
                <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 }} />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {errand.budget != null && (
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Budget</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Ionicons name="cash-outline" size={14} color={ACCENT} />
                        <Text style={{ fontSize: 15, fontWeight: '700', color: '#D97706' }}>₱{errand.budget.toLocaleString()}</Text>
                      </View>
                    </View>
                  )}
                  {errand.deadline && (
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Deadline</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>
                          {new Date(errand.deadline).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </>
            )}

            <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 }} />
            <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Type</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name={errand.is_remote ? 'cloud-outline' : 'location-outline'} size={14} color={ACCENT} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>{errand.is_remote ? 'Remote' : 'On-site'}</Text>
            </View>

            {!errand.is_remote && errand.location_name && (
              <>
                <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 }} />
                <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Location</Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                  <Ionicons name="location-outline" size={14} color={ACCENT} style={{ marginTop: 1 }} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827', flex: 1 }}>{errand.location_name}</Text>
                </View>
                {errand.address_details && (
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4, marginLeft: 20 }}>{errand.address_details}</Text>
                )}
              </>
            )}

            {images.length > 0 && (
              <>
                <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 }} />
                <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Attachments · {images.length}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {images.map((uri, i) => (
                    <TouchableOpacity key={i} onPress={() => setPreviewIndex(i)} activeOpacity={0.8}>
                      <Image source={{ uri }} style={{ width: 72, height: 72, borderRadius: 10, backgroundColor: '#F3F4F6' }} resizeMode="cover" />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 }} />
            <Text style={{ fontSize: 11, color: '#9CA3AF' }}>
              Created {new Date(errand.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </Text>
          </View>

          {/* Reports */}
          {reports.length > 0 && (
            <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 20, marginTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 16 }}>Reports ({reports.length})</Text>
              {reports.map((report, i) => (
                <View key={report.id} style={{ flexDirection: 'row', gap: 10, paddingBottom: i < reports.length - 1 ? 14 : 0, marginBottom: i < reports.length - 1 ? 14 : 0, borderBottomWidth: i < reports.length - 1 ? 1 : 0, borderBottomColor: '#F3F4F6' }}>
                  <TouchableOpacity onPress={() => router.push(`/admin/account/${report.reporter_id}`)} activeOpacity={0.7}>
                    <Image
                      source={report.reporter_avatar ? { uri: report.reporter_avatar } : require('@/assets/images/default_profile.jpg')}
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

          {/* History */}
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 20, marginTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 16 }}>History</Text>
            {events.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Ionicons name="time-outline" size={32} color="#E5E7EB" />
                <Text style={{ color: '#9CA3AF', marginTop: 8, fontSize: 13 }}>No history yet</Text>
              </View>
            ) : (
              events.map((event, i) => (
                <EventRow
                  key={event.id}
                  event={event}
                  actorName={actorNames[event.actor_id] ?? 'Unknown'}
                  isLast={i === events.length - 1}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <ImageViewer
        images={images}
        activeIndex={previewIndex}
        onClose={() => setPreviewIndex(null)}
        onIndexChange={setPreviewIndex}
      />
    </View>
  );
}
