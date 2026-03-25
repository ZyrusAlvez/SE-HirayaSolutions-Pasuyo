import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Errand {
  id: string;
  title: string;
  description: string;
  location_name?: string;
  budget?: number;
  deadline?: string;
  images?: string[];
}

interface Props {
  errand: Errand;
  onClose: () => void;
  contentOnly?: boolean;
}

function Content({ errand, onClose }: { errand: Errand; onClose: () => void }) {
  const images = errand.images?.filter(Boolean) ?? [];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
      <View className="px-5 pt-2">

        {/* Title + close */}
        <View className="flex-row items-start justify-between mb-1">
          <Text className="text-xl font-bold text-gray-900 flex-1 pr-3" numberOfLines={2}>
            {errand.title}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={22} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Meta pills */}
        <View className="flex-row flex-wrap gap-2 mt-2">
          {errand.budget != null && (
            <View className="flex-row items-center bg-amber-50 px-3 py-1.5 rounded-full">
              <Ionicons name="cash-outline" size={13} color="#FEA405" />
              <Text className="text-xs font-semibold text-amber-600 ml-1">₱{errand.budget}</Text>
            </View>
          )}
          {errand.deadline && (
            <View className="flex-row items-center bg-gray-100 px-3 py-1.5 rounded-full">
              <Ionicons name="time-outline" size={13} color="#6B7280" />
              <Text className="text-xs font-medium text-gray-600 ml-1">
                {new Date(errand.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          )}
          {errand.location_name && (
            <View className="flex-row items-center bg-gray-100 px-3 py-1.5 rounded-full" style={{ maxWidth: 200 }}>
              <Ionicons name="location-outline" size={13} color="#6B7280" />
              <Text className="text-xs font-medium text-gray-600 ml-1" numberOfLines={1}>{errand.location_name}</Text>
            </View>
          )}
        </View>

        {/* Divider */}
        <View className="border-t border-gray-100 my-4" />

        {/* Description */}
        <Text className="text-sm text-gray-600 leading-6">{errand.description}</Text>

        {/* Images strip — only if there are images */}
        {images.length > 0 && (
          <View className="mt-5">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Photos · {images.length}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
              {images.map((uri, i) => (
                <Image
                  key={i}
                  source={{ uri }}
                  style={{ width: 90, height: 90, borderRadius: 12, marginHorizontal: 4 }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          className="mt-5 py-3 rounded-2xl items-center"
          style={{ backgroundColor: '#FEA405' }}
          activeOpacity={0.85}
        >
          <Text className="text-white font-bold text-sm">Apply for this Errand</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

export default function ErrandDetailCard({ errand, onClose, contentOnly }: Props) {
  if (contentOnly) return <Content errand={errand} onClose={onClose} />;

  return (
    <View className="bg-white rounded-t-3xl shadow-2xl" style={{ flex: 1 }}>
      <View className="items-center pt-3 pb-2">
        <View className="w-10 h-1 rounded-full bg-gray-300" />
      </View>
      <Content errand={errand} onClose={onClose} />
    </View>
  );
}
