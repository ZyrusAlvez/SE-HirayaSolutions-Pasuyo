import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, Platform, Linking, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function SkeletonBox({ style }: { style?: StyleProp<ViewStyle> }) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[{ backgroundColor: '#E5E7EB', borderRadius: 8 }, style, { opacity }]} />;
}

function PanelSkeleton() {
  return (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      {/* Sort bar: "Sort" label + 3 text labels with dividers */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 4 }}>
        <SkeletonBox style={{ width: 28, height: 10, borderRadius: 4, marginRight: 6 }} />
        <SkeletonBox style={{ width: 48, height: 10, borderRadius: 4 }} />
        <View style={{ width: 1, height: 10, backgroundColor: '#E5E7EB', marginHorizontal: 4 }} />
        <SkeletonBox style={{ width: 40, height: 10, borderRadius: 4 }} />
        <View style={{ width: 1, height: 10, backgroundColor: '#E5E7EB', marginHorizontal: 4 }} />
        <SkeletonBox style={{ width: 52, height: 10, borderRadius: 4 }} />
      </View>
      <View style={{ height: 1, backgroundColor: '#F3F4F6' }} />
      {/* Errand rows */}
      {Array.from({ length: 7 }).map((_, i) => (
        <View key={i} style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: i === 6 ? 0 : 1, borderBottomColor: '#F3F4F6' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
            <SkeletonBox style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }} />
            <SkeletonBox style={{ height: 12, width: '60%', borderRadius: 4 }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <SkeletonBox style={{ width: 44, height: 22, borderRadius: 20 }} />
            <SkeletonBox style={{ width: 12, height: 12, borderRadius: 4 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function SkeletonLoading({ locationDenied, onRetryLocation }: { locationDenied?: boolean; onRetryLocation?: () => void } = {}) {
  const [isTablet, setIsTablet] = useState(Dimensions.get('window').width >= 600);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setIsTablet(window.width >= 600));
    return () => sub.remove();
  }, []);
  return (
    <View style={{ flex: 1, flexDirection: isTablet ? 'row' : 'column', gap: isTablet ? 12 : 0, padding: isTablet ? 12 : 0 }}>
      {/* Map placeholder */}
      <View style={{ flex: 1, borderRadius: 16, minHeight: isTablet ? undefined : 260, overflow: 'hidden' }}>
        <SkeletonBox style={{ position: 'absolute', inset: 0, borderRadius: 16 }} />
        {locationDenied && (
          <View style={{ position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, zIndex: 10 }}>
            <Ionicons name="location-outline" size={48} color="#6B7280" />
            <Text style={{ color: '#374151', fontSize: 16, fontWeight: '600', marginTop: 12, textAlign: 'center' }}>Location Permission Required</Text>
            <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 6, textAlign: 'center' }}>
              {Platform.OS === 'web'
                ? 'Allow location access in your browser. If blocked, click the lock icon in your address bar to reset.'
                : 'Enable location access to view nearby errands on the map.'}
            </Text>
            <TouchableOpacity
              onPress={() => Platform.OS === 'web' ? onRetryLocation?.() : Linking.openSettings()}
              style={{ marginTop: 16, backgroundColor: '#F59E0B', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>{Platform.OS === 'web' ? 'Try Again' : 'Open Settings'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Tablet: static side panel skeleton */}
      {isTablet && (
        <View style={{ width: 300, backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 }}>
          <PanelSkeleton />
        </View>
      )}
    </View>
  );
}
