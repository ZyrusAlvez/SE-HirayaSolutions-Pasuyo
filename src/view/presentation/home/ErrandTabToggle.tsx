import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Tab = 'onsite' | 'remote';

interface Props {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function ErrandTabToggle({ tab, onTabChange }: Props) {
  return (
    <View className="flex-row mx-6 mt-4 mb-2 bg-red-100 rounded-xl p-1">
      <TouchableOpacity
        className={`flex-1 py-2 rounded-lg flex-row items-center justify-center gap-1 ${tab === 'onsite' ? 'bg-white shadow' : ''}`}
        onPress={() => onTabChange('onsite')}
        activeOpacity={0.8}
      >
        <Ionicons name="location-outline" size={15} color={tab === 'onsite' ? '#111827' : '#9CA3AF'} />
        <Text className={`text-sm font-semibold ${tab === 'onsite' ? 'text-gray-900' : 'text-gray-400'}`}>
          Onsite Errands
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className={`flex-1 py-2 rounded-lg flex-row items-center justify-center gap-1 ${tab === 'remote' ? 'bg-white shadow' : ''}`}
        onPress={() => onTabChange('remote')}
        activeOpacity={0.8}
      >
        <Ionicons name="globe-outline" size={15} color={tab === 'remote' ? '#111827' : '#9CA3AF'} />
        <Text className={`text-sm font-semibold ${tab === 'remote' ? 'text-gray-900' : 'text-gray-400'}`}>
          Remote Errands
        </Text>
      </TouchableOpacity>
    </View>
  );
}
