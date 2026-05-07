import { View, Text } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

interface Props {
  total: number;
  completed: number;
  available: number;
  inProgress: number;
  expired: number;
  chartWidth: number;
}

export default function ErrandsChartPanel({ total, completed, available, inProgress, expired, chartWidth }: Props) {
  if (total === 0) return null;

  const pieData = [
    { name: 'Available', count: available, color: '#10B981', legendFontColor: '#374151', legendFontSize: 12 },
    { name: 'In Progress', count: inProgress, color: '#F59E0B', legendFontColor: '#374151', legendFontSize: 12 },
    { name: 'Completed', count: completed, color: '#3B82F6', legendFontColor: '#374151', legendFontSize: 12 },
    { name: 'Expired', count: expired, color: '#EF4444', legendFontColor: '#374151', legendFontSize: 12 },
  ].filter(d => d.count > 0);

  return (
    <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', alignItems: 'center' }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 8 }}>
        Errands Overview
      </Text>
      <PieChart
        data={pieData}
        width={chartWidth + 40}
        height={180}
        chartConfig={{ color: () => '#000', labelColor: () => '#374151' }}
        accessor="count"
        backgroundColor="transparent"
        paddingLeft="0"
      />
    </View>
  );
}
