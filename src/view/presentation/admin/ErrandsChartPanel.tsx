import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

const ACCENT = '#FEA405';
type TimeRange = 'weekly' | 'monthly' | 'yearly';

interface Props {
  total: number;
  completed: number;
  available: number;
  inProgress: number;
  expired: number;
  errands: { status: string; created_at: string; _effectiveStatus?: string }[];
  chartWidth: number;
}

function getCompletedData(errands: Props['errands'], range: TimeRange) {
  const now = new Date();
  const labels: string[] = [];
  const counts: number[] = [];
  const completed = errands.filter(e => (e._effectiveStatus ?? e.status) === 'Completed');

  if (range === 'weekly') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      labels.push(d.toLocaleDateString('en-PH', { weekday: 'short' }));
      counts.push(completed.filter(e => e.created_at.startsWith(dateStr)).length);
    }
  } else if (range === 'monthly') {
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i * 7);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      labels.push(weekStart.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }));
      counts.push(completed.filter(e => {
        const t = new Date(e.created_at);
        return t >= weekStart && t < weekEnd;
      }).length);
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      labels.push(d.toLocaleDateString('en-PH', { month: 'short' }));
      counts.push(completed.filter(e => e.created_at.startsWith(monthStr)).length);
    }
  }

  return { labels, data: counts.length ? counts : [0] };
}

export default function ErrandsChartPanel({ total, completed, available, inProgress, expired, errands, chartWidth }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');
  const barData = useMemo(() => getCompletedData(errands, timeRange), [errands, timeRange]);

  const pieData = [
    { name: 'Available', count: available, color: '#10B981', legendFontColor: '#374151', legendFontSize: 12 },
    { name: 'In Progress', count: inProgress, color: '#F59E0B', legendFontColor: '#374151', legendFontSize: 12 },
    { name: 'Completed', count: completed, color: '#3B82F6', legendFontColor: '#374151', legendFontSize: 12 },
    { name: 'Expired', count: expired, color: '#EF4444', legendFontColor: '#374151', legendFontSize: 12 },
  ].filter(d => d.count > 0);

  return (
    <View style={{ gap: 16 }}>
      {total > 0 && (
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
      )}

      <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4 }}>
          Completed Errands
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {(['weekly', 'monthly', 'yearly'] as TimeRange[]).map(r => (
            <TouchableOpacity
              key={r}
              onPress={() => setTimeRange(r)}
              style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: timeRange === r ? ACCENT : '#F3F4F6' }}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: timeRange === r ? 'white' : '#6B7280' }}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <SimpleBarChart data={barData.data} labels={barData.labels} height={140} />
      </View>
    </View>
  );
}

function SimpleBarChart({ data, labels, height }: { data: number[]; labels: string[]; height: number }) {
  const max = Math.max(...data, 1);

  return (
    <View style={{ height, justifyContent: 'flex-end' }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 20, justifyContent: 'space-between' }}>
        {[...Array(4)].map((_, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 9, color: '#D1D5DB', width: 24, textAlign: 'right', marginRight: 4 }}>
              {Math.round(max - (max / 3) * i)}
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#F3F4F6' }} />
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingLeft: 28, flex: 1, gap: 2, paddingBottom: 20 }}>
        {data.map((value, i) => {
          const barHeight = max > 0 ? (value / max) * (height - 36) : 0;
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ width: '70%', maxWidth: 28, height: Math.max(barHeight, 2), backgroundColor: ACCENT, borderRadius: 4, opacity: 0.85 }} />
            </View>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', paddingLeft: 28, gap: 2 }}>
        {labels.map((label, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 9, color: '#9CA3AF' }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
