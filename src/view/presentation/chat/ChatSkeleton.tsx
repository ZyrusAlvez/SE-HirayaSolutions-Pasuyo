import { useEffect, useRef } from 'react';
import { View, Animated, StyleProp, ViewStyle } from 'react-native';

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

export default function ChatSkeleton() {
  const bubbles = [
    { align: 'flex-start', width: '60%' },
    { align: 'flex-end', width: '45%' },
    { align: 'flex-start', width: '70%' },
    { align: 'flex-end', width: '50%' },
    { align: 'flex-start', width: '40%' },
    { align: 'flex-end', width: '65%' },
  ] as const;

  return (
    <View style={{ flex: 1, padding: 16, gap: 10, justifyContent: 'flex-end' }}>
      {bubbles.map((b, i) => (
        <View key={i} style={{ alignItems: b.align }}>
          <SkeletonBox style={{ height: 36, width: b.width, borderRadius: 12 }} />
        </View>
      ))}
    </View>
  );
}
