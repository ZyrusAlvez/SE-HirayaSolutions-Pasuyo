import { View } from 'react-native';

function Skeleton({ width, height, radius = 6 }: { width: number | string; height: number; radius?: number }) {
  return <View style={{ width: width as any, height, borderRadius: radius, backgroundColor: '#E5E7EB' }} />;
}

export function LimitBarSkeleton() {
  return (
    <View style={{ backgroundColor: 'white', borderRadius: 14, padding: 14, gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width={140} height={14} />
        <Skeleton width={70} height={18} radius={10} />
      </View>
      <Skeleton width="100%" height={10} radius={5} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Skeleton width={80} height={12} />
        <Skeleton width={80} height={12} />
      </View>
      <Skeleton width="100%" height={36} radius={8} />
    </View>
  );
}

export function PaymentHistorySkeleton() {
  return (
    <View style={{ gap: 10 }}>
      <Skeleton width={120} height={16} />
      {[1, 2].map(i => (
        <View key={i} style={{ backgroundColor: 'white', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ gap: 6 }}>
            <Skeleton width={100} height={16} />
            <Skeleton width={130} height={11} />
          </View>
          <Skeleton width={60} height={22} radius={20} />
        </View>
      ))}
    </View>
  );
}
