import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toast } from '../../../utils/toast';
import { getVerificationImage } from '../../../controllers/profileController';

const ID_TYPES = [
  { label: "Driver's License",  recommended: true  },
  { label: 'National ID',       recommended: true  },
  { label: 'Passport',          recommended: false },
  { label: 'SSS ID',            recommended: false },
  { label: 'Student ID',        recommended: false },
];

interface Step4Props {
  idType: string;
  setIdType: (value: string) => void;
  idFrontUri: string | null;
  setIdFrontUri: (uri: string | null) => void;
  idBackUri: string | null;
  setIdBackUri: (uri: string | null) => void;
}

export default function Step4({
  idType, setIdType,
  idFrontUri, setIdFrontUri,
  idBackUri, setIdBackUri,
}: Step4Props) {
  const pickImage = async (side: 'front' | 'back') => {
    const result = await getVerificationImage();
    if (!result.success) { if (result.error) toast({ title: result.error, preset: 'error' }); return; }
    if (side === 'front') setIdFrontUri(result.data);
    else setIdBackUri(result.data);
  };

  const UploadSlot = ({
    label, uri, testID, onPress, onRemove,
  }: {
    label: string; uri: string | null; testID: string; onPress: () => void; onRemove: () => void;
  }) => (
    <View className="flex-1">
      <Text className="text-xs text-gray-500 mb-1 ml-1">
        {label} <Text className="text-red-500">*</Text>
      </Text>
      <TouchableOpacity
        testID={testID}
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
            <Ionicons name="id-card-outline" size={28} color="#9CA3AF" />
            <Text className="text-xs text-gray-400 mt-1">Tap to upload</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View>
      <Text className="text-xl font-bold text-gray-800 mb-2">Identification Card</Text>
      <Text className="text-gray-600 mb-6">Select your ID type and upload a photo</Text>

      <View className="gap-2 mb-2">
        {ID_TYPES.map((id) => {
          const selected = idType === id.label;
          return (
            <TouchableOpacity
              key={id.label}
              testID={`id-type-${id.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              className={`flex-row items-center px-4 py-3 rounded-2xl border ${
                selected ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100'
              }`}
              onPress={() => setIdType(id.label)}
              activeOpacity={0.7}
            >
              <View className={`w-5 h-5 rounded-full mr-3 items-center justify-center ${
                selected ? 'bg-[#FEA405]' : 'border-2 border-gray-300'
              }`}>
                {selected && <View className="w-2 h-2 rounded-full bg-white" />}
              </View>

              <Text className="text-base text-gray-800 flex-1">{id.label}</Text>

              {id.recommended && (
                <View className="bg-orange-100 px-2 py-0.5 rounded-full mr-2">
                  <Text className="text-[#FEA405] text-xs font-semibold">recommended</Text>
                </View>
              )}

              {selected && <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />}
            </TouchableOpacity>
          );
        })}
      </View>

      {idType !== '' && (
        <View className="mt-4">
          <Text className="text-sm font-semibold text-gray-700 mb-1">
            Upload your {idType}
          </Text>
          <Text className="text-xs text-gray-400 mb-4">
            Ensure your ID is not expired and all details are legible · JPG, PNG, or WebP
          </Text>

          <View className="flex-row gap-3">
            <UploadSlot
              label="Front"
              uri={idFrontUri}
              testID="id-front-upload-btn"
              onPress={() => pickImage('front')}
              onRemove={() => setIdFrontUri(null)}
            />
            <UploadSlot
              label="Back"
              uri={idBackUri}
              testID="id-back-upload-btn"
              onPress={() => pickImage('back')}
              onRemove={() => setIdBackUri(null)}
            />
          </View>
        </View>
      )}
    </View>
  );
}
