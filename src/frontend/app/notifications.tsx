import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import Header from '../components/layout/Header';
import NavBar from '../components/layout/NavBar';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setNotifications(data);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const renderNotification = ({ item }: { item: Notification }) => {
    const timeAgo = new Date(item.created_at).toLocaleDateString('en-PH', { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => !item.read && markAsRead(item.id)}
        className={`px-4 py-3 border-b border-gray-100 ${!item.read ? 'bg-orange-50' : 'bg-white'}`}
      >
        <View className="flex-row items-start gap-3">
          <View className={`w-2 h-2 rounded-full mt-2 ${!item.read ? 'bg-orange-500' : 'bg-transparent'}`} />
          <View className="flex-1">
            <Text className="text-sm font-semibold text-gray-900">{item.title}</Text>
            <Text className="text-xs text-gray-600 mt-1">{item.message}</Text>
            <Text className="text-xs text-gray-400 mt-1">{timeAgo}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <Header />
      
      <View className={`bg-white border-b border-gray-100 ${Platform.OS !== 'web' ? 'pt-2' : 'pt-2'} pb-3 px-6 flex-row items-center justify-between`}>
        <View>
          <Text className="text-xl font-bold text-gray-900">Notifications</Text>
          {unreadCount > 0 && (
            <Text className="text-xs text-gray-400 mt-0.5">{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} activeOpacity={0.7}>
            <Text className="text-sm font-medium text-orange-500">Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400 text-sm">Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderNotification}
          contentContainerStyle={{ paddingBottom: 16 }}
          ListEmptyComponent={
            <View className="items-center justify-center mt-16">
              <Ionicons name="notifications-outline" size={48} color="#E5E7EB" />
              <Text className="text-gray-400 text-sm mt-2">No notifications yet</Text>
            </View>
          }
        />
      )}

      <NavBar />
    </View>
  );
}
