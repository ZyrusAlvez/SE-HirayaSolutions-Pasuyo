import { useEffect, useRef } from 'react';
import { View, Animated, useWindowDimensions } from 'react-native';

function Shimmer({ width, height, borderRadius = 8 }: { width: number | string; height: number; borderRadius?: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });

  return (
    <Animated.View style={{ width, height, borderRadius, backgroundColor: '#E5E7EB', opacity }} />
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 14 }} />;
}

export default function ErrandSkeleton() {
  const { width } = useWindowDimensions();
  const maxWidth = width >= 768 ? 680 : width - 40;

  return (
    <View style={{ alignSelf: 'center', width: '100%', maxWidth, padding: 20, gap: 16 }}>

      {/* Header row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Shimmer width={60} height={18} borderRadius={6} />
        <Shimmer width={90} height={24} borderRadius={20} />
      </View>

      {/* Main card */}
      <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 20, gap: 0, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
        {/* Title + status */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <Shimmer width="65%" height={22} borderRadius={6} />
          <Shimmer width={52} height={22} borderRadius={20} />
        </View>

        <Divider />

        {/* Description label */}
        <Shimmer width={80} height={11} borderRadius={4} />
        <View style={{ gap: 6, marginTop: 8 }}>
          <Shimmer width="100%" height={13} borderRadius={4} />
          <Shimmer width="92%" height={13} borderRadius={4} />
          <Shimmer width="75%" height={13} borderRadius={4} />
        </View>

        <Divider />

        {/* Budget + Deadline */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Shimmer width={50} height={11} borderRadius={4} />
            <Shimmer width={80} height={16} borderRadius={4} />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Shimmer width={60} height={11} borderRadius={4} />
            <Shimmer width={100} height={14} borderRadius={4} />
          </View>
        </View>

        <Divider />

        {/* Location */}
        <Shimmer width={60} height={11} borderRadius={4} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
          <Shimmer width={15} height={15} borderRadius={4} />
          <Shimmer width="70%" height={14} borderRadius={4} />
        </View>

        <Divider />

        {/* Attachments */}
        <Shimmer width={100} height={11} borderRadius={4} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          {[0, 1, 2].map(i => <Shimmer key={i} width={72} height={72} borderRadius={10} />)}
        </View>
      </View>

      {/* Poster card */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
        <Shimmer width={42} height={42} borderRadius={21} />
        <View style={{ flex: 1, gap: 6 }}>
          <Shimmer width={120} height={14} borderRadius={4} />
          <Shimmer width={80} height={11} borderRadius={4} />
        </View>
        <Shimmer width={40} height={44} borderRadius={10} />
      </View>

      {/* Apply button */}
      <Shimmer width="100%" height={52} borderRadius={16} />
    </View>
  );
}
