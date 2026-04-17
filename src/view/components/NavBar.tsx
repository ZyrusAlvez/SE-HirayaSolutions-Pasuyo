import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();

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
      <TouchableOpacity className="items-center" activeOpacity={0.7} onPress={() => handleNavigation('/chat')}>
        <Ionicons name="chatbubble-outline" size={24} color={isActive('/chat') ? '#FEA405' : '#9CA3AF'} />
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

      <TouchableOpacity className="items-center" activeOpacity={0.7} onPress={() => handleNavigation('/tasks')}>
        <Ionicons name="list-outline" size={24} color={isActive('/tasks') ? '#FEA405' : '#9CA3AF'} />
        <Text className={`text-xs mt-1 ${isActive('/tasks') ? 'text-orange-500 font-semibold' : 'text-gray-500'}`}>My Tasks</Text>
      </TouchableOpacity>
      </View>
    </View>
  );
}