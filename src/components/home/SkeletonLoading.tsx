import { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleProp, ViewStyle } from 'react-native';

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

const isTablet = Dimensions.get('window').width >= 600;

export default function SkeletonLoading() {
  return (
    <View style={{ flex: 1, flexDirection: isTablet ? 'row' : 'column', gap: isTablet ? 12 : 0, padding: isTablet ? 12 : 0 }}>
      {/* Map placeholder */}
      <SkeletonBox style={{ flex: 1, borderRadius: 16, minHeight: isTablet ? undefined : 260 }} />

      {/* Tablet: static side panel skeleton */}
      {isTablet && (
        <View style={{ width: 300, backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 }}>
          <PanelSkeleton />
        </View>
      )}
    </View>
  );
}
