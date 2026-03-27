import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function NavBar() {
  const router = useRouter();
  return (
    <View className={`bg-white px-6 flex-row justify-around border-t border-gray-100 ${Platform.OS === 'web' ? 'py-2' : 'py-4'}`}>
      <TouchableOpacity className="items-center" activeOpacity={0.7}>
        <Ionicons name="chatbubble-outline" size={24} color="#FEA405" />
        <Text className="text-xs mt-1 text-gray-700">Chat</Text>
      </TouchableOpacity>
      <TouchableOpacity className="items-center" activeOpacity={0.7} onPress={() => router.push('/post-errand')}>
        <Ionicons name="add-circle" size={32} color="#FEA405" />
        <Text className="text-xs mt-1 text-gray-700">Post Hustle</Text>
      </TouchableOpacity>
      <TouchableOpacity className="items-center" activeOpacity={0.7}>
        <Ionicons name="list-outline" size={24} color="#FEA405" />
        <Text className="text-xs mt-1 text-gray-700">My Tasks</Text>
      </TouchableOpacity>
    </View>
  );
}
