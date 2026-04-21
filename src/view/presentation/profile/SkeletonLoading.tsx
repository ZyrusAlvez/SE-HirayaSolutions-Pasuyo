import { useEffect, useRef } from 'react';
import { View, Text, Animated, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function Bone({ width, height, borderRadius = 8, style }: { width: number | string; height: number; borderRadius?: number; style?: object }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: '#E5E7EB', opacity }, style]}
    />
  );
}

type Props = { contentWidth?: number | undefined; isLarge?: boolean };

export default function SkeletonLoading({ contentWidth, isLarge }: Props) {
  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View className={`bg-[#FEA405] ${Platform.OS === 'web' ? 'pt-6' : 'pt-12'} pb-20 px-6 flex-row items-center w-full`}>
        <View style={{ width: contentWidth, flexDirection: 'row', alignItems: 'center', alignSelf: contentWidth ? 'center' : undefined }}>
          <Ionicons name="arrow-back" size={24} color="white" style={{ marginRight: 12 }} />
          <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>Profile Settings</Text>
        </View>
      </View>

      {/* Avatar + name */}
      <View style={{ width: contentWidth, alignSelf: isLarge ? 'center' : undefined, alignItems: 'center', marginTop: -56, marginBottom: 24 }}>
        <Bone width={112} height={112} borderRadius={56} />
        <Bone width={140} height={18} style={{ marginTop: 12 }} />
        <Bone width={180} height={14} borderRadius={6} style={{ marginTop: 8 }} />
        <Bone width={100} height={22} borderRadius={12} style={{ marginTop: 10 }} />
      </View>

      {/* Info card */}
      <View style={{
        width: contentWidth, alignSelf: isLarge ? 'center' : undefined,
        marginHorizontal: isLarge ? 0 : 16,
        backgroundColor: '#fff', borderRadius: 24, padding: 24,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
      }}>
        <Bone width={100} height={12} borderRadius={4} style={{ marginBottom: 20 }} />
        {[1, 2, 3].map(i => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
            <Bone width={80} height={14} borderRadius={4} />
            <Bone width={120} height={14} borderRadius={4} />
          </View>
        ))}
        <Bone width="100%" height={52} borderRadius={16} style={{ marginTop: 16 }} />
        <Bone width="100%" height={52} borderRadius={16} style={{ marginTop: 12 }} />
      </View>

      {/* Logout button */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: Platform.OS === 'web' ? 16 : 32, paddingTop: 12, backgroundColor: '#F9FAFB', alignItems: isLarge ? 'center' : undefined }}>
        <View style={{ width: contentWidth ?? '100%' }}>
          <TouchableOpacity
            className="bg-white border border-red-300 py-4 rounded-2xl flex-row items-center justify-center"
            disabled
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text className="text-red-500 text-base font-semibold ml-2">Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
