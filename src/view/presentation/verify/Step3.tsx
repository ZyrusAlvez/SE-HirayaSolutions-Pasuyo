import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toast } from '../../../utils/toast';
import { getVerificationImage } from '../../../controllers/profileController';

type UtilityBillType = 'Water' | 'Electricity' | 'Internet';

interface Step3Props {
  utilityBillType: UtilityBillType | '';
  setUtilityBillType: (value: UtilityBillType) => void;
  utilityBillFrontUri: string | null;
  setUtilityBillFrontUri: (uri: string | null) => void;
  utilityBillBackUri: string | null;
  setUtilityBillBackUri: (uri: string | null) => void;
}

export default function Step3({
  utilityBillType, setUtilityBillType,
  utilityBillFrontUri, setUtilityBillFrontUri,
  utilityBillBackUri, setUtilityBillBackUri,
}: Step3Props) {
  const pickImage = async (side: 'front' | 'back') => {
    const result = await getVerificationImage();
    if (!result.success) { if (result.error) toast({ title: result.error, preset: 'error' }); return; }
    if (side === 'front') setUtilityBillFrontUri(result.data);
    else setUtilityBillBackUri(result.data);
  };

  const UploadSlot = ({
    label,
    uri,
    onPress,
    onRemove,
  }: {
    label: string;
    uri: string | null;
    onPress: () => void;
    onRemove: () => void;
  }) => (
    <View className="flex-1">
      <Text className="text-xs text-gray-500 mb-1 ml-1">
        {label} <Text className="text-red-500">*</Text>
      </Text>
      <TouchableOpacity
        className="border-2 border-dashed border-gray-300 rounded-2xl items-center justify-center overflow-hidden"
        style={{ height: 130 }}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {uri ? (
          <>
            <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            <TouchableOpacity
              className="absolute top-1.5 right-1.5 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
              onPress={onRemove}
            >
              <Ionicons name="close" size={14} color="white" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Ionicons name="camera-outline" size={28} color="#9CA3AF" />
            <Text className="text-xs text-gray-400 mt-1">Tap to upload</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View>
      <Text className="text-xl font-bold text-gray-800 mb-2">Utility Bill</Text>
      <Text className="text-gray-600 mb-6">Select and upload your utility bill</Text>

      <View className="mb-6">
        <Text className="text-xs text-gray-500 mb-1 ml-1">Bill Type *</Text>
        <View className="flex-row gap-2">
          {(['Water', 'Electricity', 'Internet'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              className={`flex-1 py-3 rounded-2xl border ${
                utilityBillType === type ? 'bg-[#FEA405] border-[#FEA405]' : 'bg-gray-100 border-gray-100'
              }`}
              onPress={() => setUtilityBillType(type)}
              activeOpacity={0.7}
            >
              <Text className={`text-center font-medium ${
                utilityBillType === type ? 'text-white' : 'text-gray-700'
              }`}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {utilityBillType !== '' && (
        <>
          <Text className="text-sm font-semibold text-gray-700 mb-1">
            Upload your {utilityBillType} bill
          </Text>
          <Text className="text-xs text-gray-400 mb-4">Image must be clear and legible · JPG, PNG, or WebP</Text>

          <View className="flex-row gap-3">
            <UploadSlot
              label="Front"
              uri={utilityBillFrontUri}
              onPress={() => pickImage('front')}
              onRemove={() => setUtilityBillFrontUri(null)}
            />
            <UploadSlot
              label="Back"
              uri={utilityBillBackUri}
              onPress={() => pickImage('back')}
              onRemove={() => setUtilityBillBackUri(null)}
            />
          </View>
        </>
      )}
    </View>
  );
}
