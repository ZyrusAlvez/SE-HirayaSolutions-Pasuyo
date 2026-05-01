import { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getErrandHistory } from '@/controllers/serviceFeeController';
import type { ErrandEvent } from '@/controllers/serviceFeeController';

const EVENT_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  accepted: { icon: 'checkmark-circle', color: '#10B981', label: 'Accepted errand' },
  cancelled: { icon: 'close-circle', color: '#EF4444', label: 'Cancelled errand' },
  marked_done: { icon: 'flag', color: '#3B82F6', label: 'Marked as done' },
  reviewed: { icon: 'star', color: '#F59E0B', label: 'Left a review' },
  service_fee_paid: { icon: 'cash', color: '#8B5CF6', label: 'Service fee paid' },
};

function EventRow({ event, isLast }: { event: ErrandEvent; isLast: boolean }) {
  const config = EVENT_CONFIG[event.event_type] ?? { icon: 'ellipse', color: '#9CA3AF', label: event.event_type };
  const date = new Date(event.created_at);
  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' · ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      {/* Timeline line + dot */}
      <View style={{ alignItems: 'center', width: 24 }}>
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: config.color + '1A', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={config.icon} size={14} color={config.color} />
        </View>
        {!isLast && <View style={{ width: 2, flex: 1, backgroundColor: '#E5E7EB', marginVertical: 4 }} />}
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingBottom: isLast ? 0 : 20 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>{config.label}</Text>
        <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{formatted}</Text>
        {event.event_type === 'cancelled' && event.metadata?.reason && (
          <View style={{ marginTop: 4, gap: 2 }}>
            <Text style={{ fontSize: 11, color: '#6B7280' }}>Reason: {event.metadata.reason}</Text>
            {event.metadata.details && (
              <Text style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>"{event.metadata.details}"</Text>
            )}
          </View>
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
      </View>
    </View>
  );
}

interface Props {
  visible: boolean;
  errandId: string | null;
  errandTitle: string;
  onClose: () => void;
}

export default function ErrandHistoryModal({ visible, errandId, errandTitle, onClose }: Props) {
  const [events, setEvents] = useState<ErrandEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible || !errandId) return;
    setLoading(true);
    getErrandHistory(errandId).then(result => {
      if (result.success) setEvents(result.data);
      setLoading(false);
    });
  }, [visible, errandId]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Pressable onPress={e => e.stopPropagation()} style={{ backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 420, maxHeight: '70%' }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>Errand History</Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }} numberOfLines={1}>{errandTitle}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </Pressable>
          </View>

          {/* Content */}
          {loading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator color="#6B7280" />
            </View>
          ) : events.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Ionicons name="time-outline" size={32} color="#E5E7EB" />
              <Text style={{ color: '#9CA3AF', marginTop: 8, fontSize: 13 }}>No history yet</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {events.map((event, i) => (
                <EventRow key={event.id} event={event} isLast={i === events.length - 1} />
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
