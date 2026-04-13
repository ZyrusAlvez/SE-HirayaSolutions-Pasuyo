import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { getAnalytics, AnalyticsData } from '../../controllers/adminController';
import AdminNavBar from '../../view/presentation/admin/AdminNavBar';

const ACCENT = '#FEA405';

const STATUS_COLORS: Record<string, string> = {
  'Available':   '#22C55E',
  'In Progress': '#3B82F6',
  'Completed':   '#9CA3AF',
  'Expired':     '#EF4444',
};

export default function AdminAnalyticsScreen() {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width - 48, 600);

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics().then(result => {
      if (result.success && result.data) setAnalytics(result.data);
      setLoading(false);
    });
  }, []);

  const chartConfig = {
    backgroundColor: 'white',
    backgroundGradientFrom: 'white',
    backgroundGradientTo: 'white',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(254, 164, 5, ${opacity})`,
    labelColor: () => '#9CA3AF',
    propsForDots: { r: '4', strokeWidth: '2', stroke: ACCENT },
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View className={`bg-white border-b border-gray-100 ${Platform.OS !== 'web' ? 'pt-12' : 'pt-2'} pb-3 px-6`}>
        <Text className="text-xl font-bold text-gray-900">Analytics</Text>
        <Text className="text-xs text-gray-400 mt-0.5">Last 7 days overview</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text className="text-gray-400 text-sm">Loading analytics...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}>
          <View className="bg-white rounded-2xl p-4 border border-gray-100">
            <Text className="text-sm font-bold text-gray-700 mb-4">Errands Posted (Last 7 Days)</Text>
            <LineChart
              data={{ labels: analytics?.lineData.labels ?? [], datasets: [{ data: analytics?.lineData.data.length ? analytics.lineData.data : [0] }] }}
              width={chartWidth}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={{ borderRadius: 12 }}
            />
          </View>

          <View className="bg-white rounded-2xl p-4 border border-gray-100">
            <Text className="text-sm font-bold text-gray-700 mb-4">Errand Status Breakdown</Text>
            {analytics?.pieData.length ? (
              <PieChart
                data={analytics.pieData.map(({ name, count }) => ({
                  name, count,
                  color: STATUS_COLORS[name] ?? '#D1D5DB',
                  legendFontColor: '#6B7280',
                  legendFontSize: 12,
                }))}
                width={chartWidth}
                height={200}
                chartConfig={chartConfig}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="16"
              />
            ) : (
              <View style={{ height: 200, alignItems: 'center', justifyContent: 'center' }}>
                <Text className="text-gray-400 text-sm">No errand data yet</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <AdminNavBar />
    </View>
  );
}
