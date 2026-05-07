import { View, useWindowDimensions } from 'react-native';

function Bone({ width, height, radius = 6 }: { width: number | string; height: number; radius?: number }) {
  return <View style={{ width: width as any, height, borderRadius: radius, backgroundColor: '#E5E7EB' }} />;
}

export function ErrandsListSkeleton() {
  return (
    <View style={{ padding: 16, gap: 8 }}>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <View key={i} style={{ backgroundColor: 'white', borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#F3F4F6' }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Bone width="70%" height={13} />
            <Bone width="40%" height={11} />
          </View>
          <Bone width={70} height={20} radius={10} />
          <Bone width={16} height={16} radius={8} />
        </View>
      ))}
    </View>
  );
}

export function ErrandsChartSkeleton() {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width - 48, 280);

  return (
    <View style={{ gap: 16 }}>
      <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', alignItems: 'center', gap: 8 }}>
        <Bone width={130} height={14} />
        <Bone width={chartWidth} height={160} radius={12} />
      </View>
      <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', gap: 8 }}>
        <Bone width={130} height={14} />
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
