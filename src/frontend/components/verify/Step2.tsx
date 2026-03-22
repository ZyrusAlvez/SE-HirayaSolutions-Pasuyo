import { View, Text, TextInput } from 'react-native';

interface Step2Props {
  idNumber: string;
  setIdNumber: (value: string) => void;
}

export default function Step2({ idNumber, setIdNumber }: Step2Props) {
  return (
    <View>
      <Text className="text-xl font-bold text-gray-800 mb-2">ID Number</Text>
      <Text className="text-gray-600 mb-6">Enter your government-issued ID number</Text>
      <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4">
        <TextInput
          className="py-4 text-base"
          placeholder="1234-5678-9012"
          placeholderTextColor="#9CA3AF"
          value={idNumber}
          onChangeText={setIdNumber}
        />
      </View>
    </View>
  );
}
