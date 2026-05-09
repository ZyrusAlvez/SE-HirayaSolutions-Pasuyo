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

export default function ConversationSkeleton({ testID }: { testID?: string }) {
  return (
    <View testID={testID} style={{ flex: 1 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 16, gap: 12 }}>
          <SkeletonBox style={{ width: 40, height: 40, borderRadius: 20 }} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBox style={{ height: 12, width: '50%', borderRadius: 4 }} />
            <SkeletonBox style={{ height: 10, width: '75%', borderRadius: 4 }} />
          </View>
          <SkeletonBox style={{ width: 24, height: 10, borderRadius: 4 }} />
        </View>
      ))}
    </View>
  );
}
