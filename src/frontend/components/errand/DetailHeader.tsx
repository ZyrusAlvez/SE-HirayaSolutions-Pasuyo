import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { toast } from '../../lib/toast';

interface Props {
  isRemote: boolean;
  errandId: string;
}

export default function ErrandDetailHeader({ isRemote, errandId }: Props) {
  const router = useRouter();
  const typeLabel = isRemote ? 'Remote Errand' : 'Onsite Errand';
  const typeColor = isRemote ? '#3B82F6' : '#10B981';

  const handleShare = async () => {
    const url = Platform.OS === 'web'
      ? window.location.href
      : `https://pasuyo.app/errand/${errandId}`;
    await Clipboard.setStringAsync(url);
    toast({ title: 'Link copied to clipboard', preset: 'done' });
  };

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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TouchableOpacity onPress={handleShare} activeOpacity={0.7}>
          <Ionicons name="share-social-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
        <View style={{ backgroundColor: typeColor + '1A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: typeColor }}>{typeLabel}</Text>
        </View>
      </View>
    </View>
  );
}
