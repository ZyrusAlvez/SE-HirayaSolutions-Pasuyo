import { View, Text, TouchableOpacity } from 'react-native';

const ACCENT = '#FEA405';

interface Props {
  isRemote: boolean;
  onChange: (isRemote: boolean) => void;
}

export default function TaskType({ isRemote, onChange }: Props) {
  return (
    <>
      <Text className="text-xs text-gray-500 mb-1 ml-1">Task Type *</Text>
      <View className="flex-row mb-4 gap-3">
        {(['Remote', 'Onsite'] as const).map((type) => {
          const selected = type === 'Remote' ? isRemote : !isRemote;
          return (
            <TouchableOpacity
              key={type}
              onPress={() => onChange(type === 'Remote')}
              className={`flex-1 py-4 rounded-2xl border items-center bg-gray-50 ${selected ? 'border-[#FEA405]' : 'border-gray-200'}`}
            >
              <Text className={`text-base font-semibold ${selected ? 'text-[#FEA405]' : 'text-gray-400'}`}>{type}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}
