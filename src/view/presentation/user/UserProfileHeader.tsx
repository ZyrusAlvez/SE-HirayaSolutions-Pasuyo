import { useState } from 'react';
import { View, Text, Image, Pressable, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ReportModal from '@/view/presentation/user/ReportModal';

interface Props {
  userName?: string;
}

export default function UserProfileHeader({ userName }: Props) {
  const router = useRouter();
  const isWeb = Platform.OS === 'web';
  const [reportHover, setReportHover] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: isWeb ? 8 : 48 }]}>
      <View style={styles.inner}>
        <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 1 }}>
          <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginLeft: 4 }}>
            {userName ? `${userName}'s Profile` : 'User Profile'}
          </Text>
        </View>
        <View style={styles.logoWrap}>
          <Pressable onPress={() => router.push('/')} style={{ alignItems: 'center' }}>
            <Image
              source={require('@/assets/logo/Pasuyo_full.png')}
              style={{ width: isWeb ? 100 : 120, height: isWeb ? 32 : 40 }}
              resizeMode="contain"
            />
          </Pressable>
        </View>
        <View style={{ position: 'relative' }}>
          <Pressable
            onPress={() => setReportVisible(true)}
            // @ts-ignore — web-only hover props
            onMouseEnter={() => setReportHover(true)}
            onMouseLeave={() => setReportHover(false)}
            style={{ padding: 8 }}
          >
            <Ionicons name="flag-outline" size={22} color="#EF4444" />
          </Pressable>
          {reportHover && (
            <View style={styles.tooltip}>
              <Text style={{ color: '#FFFFFF', fontSize: 11, whiteSpace: 'nowrap' } as any}>
                Report {userName ?? 'user'}
              </Text>
            </View>
          )}
        </View>
      </View>
      <ReportModal visible={reportVisible} userName={userName} onClose={() => setReportVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 8,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  logoWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tooltip: {
    position: 'absolute',
    bottom: -28,
    right: 0,
    backgroundColor: '#1F2937',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    zIndex: 10,
  },
});
