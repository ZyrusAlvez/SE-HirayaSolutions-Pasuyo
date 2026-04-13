import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ACCENT = '#FEA405';

interface Props {
  pinnedLocation: { lat: number; lng: number; name: string } | null;
  onPress: () => void;
}

export default function LocationPicker({ pinnedLocation, onPress }: Props) {
  return (
    <View className="mb-4">
      <Text className="text-xs text-gray-500 mb-1 ml-1">Location *</Text>
      <TouchableOpacity
        onPress={onPress}
        className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 flex-row items-center"
      >
        <Ionicons name="location-outline" size={18} color={ACCENT} />
        <Text className={`ml-2 text-base flex-1 ${pinnedLocation ? 'text-gray-900' : 'text-gray-400'}`} numberOfLines={1}>
          {pinnedLocation?.name || 'Tap to pin location on map'}
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
}
