import { View, Text } from 'react-native';

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  'Available':   { bg: 'bg-green-100',  text: 'text-green-700'  },
  'In Progress': { bg: 'bg-blue-100',   text: 'text-blue-700'   },
  'Completed':   { bg: 'bg-gray-100',   text: 'text-gray-600'   },
  'Expired':     { bg: 'bg-red-100',    text: 'text-red-500'    },
};

export interface Errand {
  id: string;
  title: string;
  poster_name: string | null;
  budget: number | null;
  status: string;
  is_remote: boolean;
  created_at: string;
}

export default function ErrandCard({ errand }: { errand: Errand }) {
  const style = STATUS_STYLES[errand.status] ?? { bg: 'bg-gray-100', text: 'text-gray-600' };

  return (
    <View className="bg-white rounded-2xl px-4 py-3 border border-gray-100 gap-1" testID={`errand-card-${errand.id}`}>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-gray-900 flex-1 mr-2" numberOfLines={1} testID={`errand-title-${errand.id}`}>{errand.title}</Text>
        <View className={`px-2 py-1 rounded-full ${style.bg}`}>
          <Text className={`text-xs font-medium ${style.text}`}>{errand.status}</Text>
        </View>
      </View>
      <Text className="text-xs text-gray-500">by {errand.poster_name ?? '—'}</Text>
      <View className="flex-row items-center justify-between mt-1">
        <Text className="text-xs text-gray-400">{errand.is_remote ? 'Remote' : 'On-site'}</Text>
        <Text className="text-xs font-semibold text-gray-700">
          {errand.budget != null ? `₱${errand.budget.toLocaleString()}` : 'No budget'}
        </Text>
      </View>
    </View>
  );
}
