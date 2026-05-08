import { View, useWindowDimensions } from 'react-native';

function Bone({ width, height, radius = 6 }: { width: number | string; height: number; radius?: number }) {
  return <View style={{ width: width as any, height, borderRadius: radius, backgroundColor: '#E5E7EB' }} />;
}

export function AccountsListSkeleton() {
  return (
    <View style={{ padding: 16, gap: 8 }}>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <View key={i} style={{ backgroundColor: 'white', borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#F3F4F6' }}>
          <Bone width={44} height={44} radius={22} />
          <View style={{ flex: 1, gap: 6 }}>
            <Bone width="60%" height={13} />
            <Bone width="80%" height={11} />
            <Bone width="40%" height={10} />
          </View>
          <Bone width={70} height={20} radius={10} />
        </View>
      ))}
    </View>
  );
}

export function AccountsChartSkeleton() {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width - 48, 280);

  return (
    <View style={{ gap: 16 }}>
      <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', alignItems: 'center', gap: 8 }}>
        <Bone width={140} height={14} />
        <Bone width={200} height={12} />
        <Bone width={chartWidth} height={160} radius={12} />
      </View>
      <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', gap: 8 }}>
        <Bone width={100} height={14} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Bone width={60} height={24} radius={12} />
          <Bone width={60} height={24} radius={12} />
          <Bone width={60} height={24} radius={12} />
        </View>
        <Bone width="100%" height={120} radius={8} />
      </View>
    </View>
  );
}
