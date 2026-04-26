import { View, Text, TouchableOpacity, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';

import { toast } from '@/utils/toast';

interface Props {
  isRemote: boolean;
  errandId: string;
}

export default function ErrandDetailHeader({ isRemote, errandId }: Props) {
  const router = useRouter();
  const [reportHover, setReportHover] = useState(false);
  const [shareHover, setShareHover] = useState(false);
  const typeLabel = isRemote ? 'Remote Errand' : 'Onsite Errand';
  const typeIcon = isRemote ? 'cloud-outline' : 'location-outline';

  const handleShare = async () => {
    const url = Platform.OS === 'web'
      ? window.location.href
      : `https://pasuyo.app/errand/${errandId}`;
    await Clipboard.setStringAsync(url);
    toast({ title: 'Link copied to clipboard', preset: 'done' });
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
      <TouchableOpacity
        onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={20} color="#374151" />
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>Back</Text>
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
          <Ionicons name={typeIcon} size={12} color="#6B7280" />
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7280' }}>{typeLabel}</Text>
        </View>
        <View style={{ position: 'relative' }}>
          <Pressable
            onPress={handleShare}
            // @ts-ignore — web-only hover props
            onMouseEnter={() => setShareHover(true)}
            onMouseLeave={() => setShareHover(false)}
            style={{ padding: 4 }}
          >
            <Ionicons name="share-social-outline" size={20} color="#6B7280" />
          </Pressable>
          {shareHover && (
            <View style={{ position: 'absolute', top: 32, right: 0, backgroundColor: '#1F2937', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, zIndex: 9999, elevation: 9999 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 11, whiteSpace: 'nowrap' } as any}>Copy Errand's URL</Text>
            </View>
          )}
        </View>
        <View style={{ position: 'relative' }}>
          <Pressable
            onPress={() => {}}
            // @ts-ignore — web-only hover props
            onMouseEnter={() => setReportHover(true)}
            onMouseLeave={() => setReportHover(false)}
            style={{ padding: 4 }}
          >
            <Ionicons name="flag-outline" size={20} color="#EF4444" />
          </Pressable>
          {reportHover && (
            <View style={{ position: 'absolute', top: 32, right: 0, backgroundColor: '#1F2937', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, zIndex: 9999, elevation: 9999 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 11, whiteSpace: 'nowrap' } as any}>Report errand</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
