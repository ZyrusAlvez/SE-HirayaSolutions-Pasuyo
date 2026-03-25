import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Props {
  isRemote: boolean;
}

export default function ErrandDetailHeader({ isRemote }: Props) {
  const router = useRouter();
  const typeLabel = isRemote ? 'Remote Errand' : 'Onsite Errand';
  const typeColor = isRemote ? '#3B82F6' : '#10B981';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <TouchableOpacity
        onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={20} color="#374151" />
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>Back</Text>
      </TouchableOpacity>
      <View style={{ backgroundColor: typeColor + '1A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: typeColor }}>{typeLabel}</Text>
      </View>
    </View>
  );
}
