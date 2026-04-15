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
    <View className={`bg-white px-6 flex flex-row justify-around border-t border-gray-100 ${Platform.OS === 'web' ? 'py-2' : 'py-4'}`}>
      <TouchableOpacity className="items-center" activeOpacity={0.7} onPress={() => handleNavigation('/chat')}>
        <Ionicons name="chatbubble-outline" size={24} color={isActive('/chat') ? '#FEA405' : '#9CA3AF'} />
        <Text className={`text-xs mt-1 ${isActive('/chat') ? 'text-orange-500 font-semibold' : 'text-gray-500'}`}>Chat</Text>
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