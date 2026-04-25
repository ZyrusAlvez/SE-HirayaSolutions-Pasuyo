import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useUnread } from '@/context/UnreadContext';

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount } = useUnread();

  const isActive = (path: string) => pathname === path;

  const handleNavigation = (path: string) => {
    if (isActive(path)) {
      router.push('/');
    } else {
      router.push(path as any);
    }
  };

  return (
    <View style={{ backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignSelf: 'center', width: '100%', maxWidth: 1200, paddingHorizontal: 24, paddingVertical: Platform.OS === 'web' ? 8 : 16 }}>
<<<<<<< HEAD
      <TouchableOpacity testID="nav-chat" className="items-center" activeOpacity={0.7} onPress={() => handleNavigation('/chat')}>
        <Ionicons name="chatbubble-outline" size={24} color={isActive('/chat') ? '#FEA405' : '#9CA3AF'} />
=======
      <TouchableOpacity className="items-center" activeOpacity={0.7} onPress={() => handleNavigation('/chat')}>
        <View>
          <Ionicons name="chatbubble-outline" size={24} color={isActive('/chat') ? '#FEA405' : '#9CA3AF'} />
          {unreadCount > 0 && (
            <View style={{ position: 'absolute', top: -4, right: -8, backgroundColor: '#EF4444', borderRadius: 10, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
>>>>>>> a673190613b66e7bf3ddbe3997b32754c19e02b3
        <Text className={`text-xs mt-1 ${isActive('/chat') ? 'text-orange-500 font-semibold' : 'text-gray-500'}`}>Chat</Text>
      </TouchableOpacity>

      <TouchableOpacity className="items-center" activeOpacity={0.7} onPress={() => handleNavigation('/')}>
        <Ionicons name="home-outline" size={24} color={isActive('/') ? '#FEA405' : '#9CA3AF'} />
        <Text className={`text-xs mt-1 ${isActive('/') ? 'text-orange-500 font-semibold' : 'text-gray-500'}`}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity className="items-center" activeOpacity={0.7} onPress={() => handleNavigation('/post-errand')}>
        <Ionicons name="add-circle-outline" size={24} color={isActive('/post-errand') ? '#FEA405' : '#9CA3AF'} />
        <Text className={`text-xs mt-1 ${isActive('/post-errand') ? 'text-orange-500 font-semibold' : 'text-gray-500'}`}>Post Errand</Text>
      </TouchableOpacity>

      <TouchableOpacity className="items-center" activeOpacity={0.7} onPress={() => handleNavigation('/dashboard')}>
        <Ionicons name="list-outline" size={24} color={isActive('/dashboard') ? '#FEA405' : '#9CA3AF'} />
        <Text className={`text-xs mt-1 ${isActive('/dashboard') ? 'text-orange-500 font-semibold' : 'text-gray-500'}`}>Dashboard</Text>
      </TouchableOpacity>
      </View>
    </View>
  );
}