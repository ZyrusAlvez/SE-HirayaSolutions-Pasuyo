import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Errand {
  id: string;
  title: string;
  description: string;
  budget?: number;
  deadline?: string;
}

interface Props {
  errands: Errand[];
}

export default function RemoteErrandList({ errands }: Props) {
  if (errands.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <Ionicons name="globe-outline" size={48} color="#9CA3AF" />
        <Text className="text-gray-400 mt-2">No remote errands yet</Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {errands.map(e => (
        <View key={e.id} className="bg-white border border-gray-100 rounded-2xl p-4 mb-3 shadow-sm">
          <Text className="text-base font-semibold text-gray-900">{e.title}</Text>
          <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>{e.description}</Text>
          <View className="flex-row mt-3 gap-3">
            {e.budget != null && (
              <View className="flex-row items-center">
                <Ionicons name="cash-outline" size={14} color="#FEA405" />
                <Text className="text-xs text-gray-600 ml-1">₱{e.budget}</Text>
              </View>
            )}
            {e.deadline && (
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={14} color="#FEA405" />
                <Text className="text-xs text-gray-600 ml-1">{new Date(e.deadline).toLocaleDateString()}</Text>
              </View>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
