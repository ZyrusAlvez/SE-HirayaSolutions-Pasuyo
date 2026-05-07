import { View } from 'react-native';

function Bone({ width, height, radius = 6 }: { width: number | string; height: number; radius?: number }) {
  return <View style={{ width: width as any, height, borderRadius: radius, backgroundColor: '#E5E7EB' }} />;
}

export default function UserDetailSkeleton() {
  return (
    <View style={{ padding: 16, gap: 16 }}>
      {/* Profile card skeleton */}
      <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#F3F4F6' }}>
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
          <Bone width={64} height={64} radius={32} />
          <View style={{ flex: 1, gap: 6 }}>
            <Bone width="50%" height={16} />
            <Bone width="70%" height={13} />
            <Bone width={80} height={20} radius={10} />
          </View>
        </View>
        <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12, gap: 10 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Bone width={100} height={12} />
              <Bone width={120} height={12} />
            </View>
          ))}
        </View>
      </View>

      {/* Activity skeleton */}
      <View style={{ gap: 6 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <View key={i} style={{ backgroundColor: 'white', borderRadius: 12, padding: 12, flexDirection: 'row', gap: 10, borderWidth: 1, borderColor: '#F3F4F6' }}>
            <Bone width={28} height={28} radius={14} />
            <View style={{ flex: 1, gap: 4 }}>
              <Bone width="50%" height={12} />
              <Bone width="30%" height={10} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
