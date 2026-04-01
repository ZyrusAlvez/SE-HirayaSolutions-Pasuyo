import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { supabaseAdmin } from '../../lib/supabase';
import AdminNavBar from '../../components/admin/AdminNavBar';

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

  const [lineData, setLineData] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
  const [pieData, setPieData] = useState<{ name: string; count: number; color: string; legendFontColor: string; legendFontSize: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabaseAdmin
        .from('errands')
        .select('created_at, status');

      if (!data) return;

      // Line chart — last 7 days
      const today = new Date();
      const labels: string[] = [];
      const counts: number[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const label = d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
        const dateStr = d.toISOString().split('T')[0];
        const count = data.filter(e => e.created_at.startsWith(dateStr)).length;
        labels.push(label);
        counts.push(count);
      }
      setLineData({ labels, data: counts });

      // Pie chart — status breakdown
      const statusCounts: Record<string, number> = {};
      data.forEach(e => {
        statusCounts[e.status] = (statusCounts[e.status] ?? 0) + 1;
      });
      const pie = Object.entries(statusCounts).map(([name, count]) => ({
        name,
        count,
        color: STATUS_COLORS[name] ?? '#D1D5DB',
        legendFontColor: '#6B7280',
        legendFontSize: 12,
      }));
      setPieData(pie);
      setLoading(false);
    };

    fetchData();
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
          {/* Line Chart */}
          <View className="bg-white rounded-2xl p-4 border border-gray-100">
            <Text className="text-sm font-bold text-gray-700 mb-4">Errands Posted (Last 7 Days)</Text>
            <LineChart
              data={{ labels: lineData.labels, datasets: [{ data: lineData.data.length ? lineData.data : [0] }] }}
              width={chartWidth}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={{ borderRadius: 12 }}
            />
          </View>

          {/* Pie Chart */}
          <View className="bg-white rounded-2xl p-4 border border-gray-100">
            <Text className="text-sm font-bold text-gray-700 mb-4">Errand Status Breakdown</Text>
            {pieData.length > 0 ? (
              <PieChart
                data={pieData}
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
