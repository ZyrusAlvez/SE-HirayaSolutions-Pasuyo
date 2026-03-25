import { View, Text, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DEFAULT_AVATAR = require('../../assets/images/default_profile.jpg');

interface Errand {
  id: string;
  title: string;
  description: string;
  budget?: number;
  deadline?: string;
  poster_name?: string;
  poster_avatar?: string;
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
          <View className="flex-row items-center mb-2">
            <Image
              source={e.poster_avatar ? { uri: e.poster_avatar } : DEFAULT_AVATAR}
              style={{ width: 28, height: 28, borderRadius: 14 }}
            />
            <Text className="text-xs text-gray-500 ml-2 flex-1" numberOfLines={1}>{e.poster_name ?? 'Unknown'}</Text>
          </View>
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
