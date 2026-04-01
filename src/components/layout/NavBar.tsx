import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    setUnreadCount(count || 0);
  };

  useEffect(() => {
    fetchUnreadCount();

    const channel = supabase
      .channel('navbar-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const isActive = (path: string) => pathname === path;

  const handleNavigation = (path: string) => {
    if (isActive(path)) {
      router.push('/');
    } else {
      router.push(path);
    }
  };

  return (
    <View className={`bg-white px-6 flex-row justify-around border-t border-gray-100 ${Platform.OS === 'web' ? 'py-2' : 'py-4'}`}>
      <TouchableOpacity className="items-center" activeOpacity={0.7} onPress={() => handleNavigation('/chat')}>
        <Ionicons name="chatbubble-outline" size={24} color={isActive('/chat') ? '#FEA405' : '#9CA3AF'} />
        <Text className={`text-xs mt-1 ${isActive('/chat') ? 'text-orange-500 font-semibold' : 'text-gray-500'}`}>Chat</Text>
      </TouchableOpacity>
      
      <TouchableOpacity className="items-center" activeOpacity={0.7} onPress={() => handleNavigation('/notifications')}>
        <View>
          <Ionicons name="notifications-outline" size={24} color={isActive('/notifications') ? '#FEA405' : '#9CA3AF'} />
          {unreadCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[16px] h-4 items-center justify-center px-1">
              <Text className="text-white text-[10px] font-bold">{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
        <Text className={`text-xs mt-1 ${isActive('/notifications') ? 'text-orange-500 font-semibold' : 'text-gray-500'}`}>Alerts</Text>
      </TouchableOpacity>

      <TouchableOpacity className="items-center" activeOpacity={0.7} onPress={() => router.push('/post-errand')}>
        <Ionicons name="add-circle" size={32} color="#FEA405" />
        <Text className="text-xs mt-1 text-gray-700">Post Hustle</Text>
      </TouchableOpacity>
      
      <TouchableOpacity className="items-center" activeOpacity={0.7} onPress={() => handleNavigation('/tasks')}>
        <Ionicons name="list-outline" size={24} color={isActive('/tasks') ? '#FEA405' : '#9CA3AF'} />
        <Text className={`text-xs mt-1 ${isActive('/tasks') ? 'text-orange-500 font-semibold' : 'text-gray-500'}`}>My Tasks</Text>
      </TouchableOpacity>
    </View>
  );
}