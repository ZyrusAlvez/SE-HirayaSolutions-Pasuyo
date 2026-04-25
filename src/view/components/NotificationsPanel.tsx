import { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  getNotifications,
  updateNotificationRead,
  updateAllNotificationsRead,
  getNotificationsSubscription,
  removeNotificationsSubscription,
} from '@/controllers/notificationController';
import type { Notification } from '@/controllers/notificationController';

interface Props {
  visible: boolean;
  onClose: () => void;
  onUnreadChange?: (count: number) => void;
}

export default function NotificationsPanel({ visible, onClose, onUnreadChange }: Props) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const channelName = useRef(`notifications-panel-${Date.now()}`);

  const loadNotifications = async () => {
    const result = await getNotifications(0);
    if (result.success) {
      setNotifications(result.data.notifications);
      setHasMore(result.data.hasMore);
      onUnreadChange?.(result.data.notifications.filter(n => !n.is_read).length);
    }
    setLoading(false);
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const result = await getNotifications(notifications.length);
    if (result.success) {
      setNotifications(prev => [...prev, ...result.data.notifications]);
      setHasMore(result.data.hasMore);
    }
    setLoadingMore(false);
  };

  const loadRef = useRef(loadNotifications);
  useEffect(() => { loadRef.current = loadNotifications; });

  const markAsRead = async (id: string, action?: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, is_read: true } : n);
      onUnreadChange?.(updated.filter(n => !n.is_read).length);
      return updated;
    });
    updateNotificationRead(id);
    if (action) {
      onClose();
      router.push(action as any);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    onUnreadChange?.(0);
    updateAllNotificationsRead();
  };

  useEffect(() => {
    if (!visible) return;
    loadRef.current();
    const channel = getNotificationsSubscription(channelName.current, () => loadRef.current());
    return () => { removeNotificationsSubscription(channel); };
  }, [visible]);

  const unreadCount = (notifications ?? []).filter(n => !n.is_read).length;
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
  const topOffset = Platform.OS === 'web' ? 52 : 100 + statusBarHeight;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose}>
        <View
          style={{ position: 'absolute', top: topOffset, right: 16, width: 320, maxHeight: 480, backgroundColor: 'white', borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8, overflow: 'hidden' }}
        >
          <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>Notifications</Text>
                {unreadCount > 0 && <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{unreadCount} unread</Text>}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={markAllAsRead} activeOpacity={0.7}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#FEA405' }}>Mark all read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                  <Ionicons name="close" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            {loading ? (
              <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                <Text style={{ color: '#9CA3AF', fontSize: 13 }}>Loading...</Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={item => item.id}
                style={{ maxHeight: 400 }}
                onEndReached={hasMore ? loadMore : undefined}
                onEndReachedThreshold={0.3}
                ListFooterComponent={loadingMore ? <Text style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 12, paddingVertical: 12 }}>Loading...</Text> : null}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    testID={`notification-item-${item.id}`}
                    activeOpacity={0.7}
                    onPress={() => markAsRead(item.id, item.action ?? undefined)}
                    style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F9FAFB', backgroundColor: item.is_read ? 'white' : '#FFF7ED' }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                      <View style={{ width: 7, height: 7, borderRadius: 4, marginTop: 5, backgroundColor: item.is_read ? 'transparent' : '#FEA405' }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>{item.title}</Text>
                        <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{item.message}</Text>
                        <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                          {new Date(item.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                    <Ionicons name="notifications-outline" size={40} color="#E5E7EB" />
                    <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 8 }}>No notifications yet</Text>
                  </View>
                }
              />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
