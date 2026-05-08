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
      <TouchableOpacity style={{ flex: 1, alignItems: 'center' }} activeOpacity={0.7} onPress={() => handleNavigation('/chat')}>
        <View>
          <Ionicons name="chatbubble-outline" size={24} color={isActive('/chat') ? '#FEA405' : '#9CA3AF'} />
          {unreadCount > 0 && (
            <View style={{ position: 'absolute', top: -4, right: -8, backgroundColor: '#EF4444', borderRadius: 10, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
        <Text className={`text-xs mt-1 ${isActive('/chat') ? 'text-orange-500 font-semibold' : 'text-gray-500'}`}>Chat</Text>
      </TouchableOpacity>

      <TouchableOpacity style={{ flex: 1, alignItems: 'center' }} activeOpacity={0.7} onPress={() => handleNavigation('/post-errand')}>
        <Ionicons name="add-circle-outline" size={24} color={isActive('/post-errand') ? '#FEA405' : '#9CA3AF'} />
        <Text className={`text-xs mt-1 ${isActive('/post-errand') ? 'text-orange-500 font-semibold' : 'text-gray-500'}`}>Post</Text>
      </TouchableOpacity>

      <TouchableOpacity style={{ flex: 1, alignItems: 'center' }} activeOpacity={0.7} onPress={() => handleNavigation('/')}>
        <Ionicons name="home-outline" size={24} color={isActive('/') ? '#FEA405' : '#9CA3AF'} />
        <Text className={`text-xs mt-1 ${isActive('/') ? 'text-orange-500 font-semibold' : 'text-gray-500'}`}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={{ flex: 1, alignItems: 'center' }} activeOpacity={0.7} onPress={() => handleNavigation('/dashboard')}>
        <Ionicons name="list-outline" size={24} color={isActive('/dashboard') ? '#FEA405' : '#9CA3AF'} />
        <Text className={`text-xs mt-1 ${isActive('/dashboard') ? 'text-orange-500 font-semibold' : 'text-gray-500'}`}>Errands</Text>
      </TouchableOpacity>

      <TouchableOpacity style={{ flex: 1, alignItems: 'center' }} activeOpacity={0.7} onPress={() => handleNavigation('/service-fee')}>
        <Ionicons name="pricetag-outline" size={24} color={isActive('/service-fee') ? '#FEA405' : '#9CA3AF'} />
        <Text className={`text-xs mt-1 ${isActive('/service-fee') ? 'text-orange-500 font-semibold' : 'text-gray-500'}`}>Fees</Text>
      </TouchableOpacity>
      </View>
    </View>
  );
}