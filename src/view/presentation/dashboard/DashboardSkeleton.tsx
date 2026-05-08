import { View, useWindowDimensions } from 'react-native';

function Skeleton({ width, height, radius = 6 }: { width: number | string; height: number; radius?: number }) {
  return <View style={{ width: width as any, height, borderRadius: radius, backgroundColor: '#E5E7EB' }} />;
}

function CardSkeleton() {
  return (
    <View style={{ backgroundColor: 'white', borderRadius: 14, padding: 14, gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width={60} height={18} radius={20} />
        <Skeleton width={16} height={16} radius={4} />
      </View>
      <Skeleton width="80%" height={14} />
      <Skeleton width="60%" height={12} />
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
        <Skeleton width={60} height={12} />
        <Skeleton width={50} height={12} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
        <Skeleton width={20} height={20} radius={10} />
        <Skeleton width={80} height={11} />
      </View>
    </View>
  );
}

function RowSkeleton() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}>
      <Skeleton width={32} height={32} radius={16} />
      <View style={{ flex: 1, gap: 4 }}>
        <Skeleton width="70%" height={13} />
        <Skeleton width="40%" height={11} />
      </View>
      <Skeleton width={60} height={18} radius={20} />
    </View>
  );
}

interface Props {
  viewMode: 'card' | 'list';
}

export default function DashboardSkeleton({ viewMode }: Props) {
  const { width } = useWindowDimensions();
  const columns = width >= 1024 ? 4 : width >= 768 ? 3 : 2;

  if (viewMode === 'list') {
    return (
      <View style={{ padding: 20 }}>
        <View style={{ backgroundColor: 'white', borderRadius: 14, borderWidth: 1, borderColor: '#F3F4F6', overflow: 'hidden' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <View key={i} style={i < 5 ? { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' } : undefined}>
              <RowSkeleton />
            </View>
          ))}
        </View>
      </View>
    );
  }

  const cardWidth = `${Math.floor(100 / columns) - 2}%` as const;

  return (
    <View style={{ padding: 20 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <View key={i} style={{ width: cardWidth }}>
            <CardSkeleton />
          </View>
        ))}
      </View>
    </View>
  );
}
