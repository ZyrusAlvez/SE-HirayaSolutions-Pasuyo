import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { toast } from 'burnt';

interface Step4Props {
  selfieImage: string | null;
  setSelfieImage: (uri: string) => void;
}

export default function Step4({ selfieImage, setSelfieImage }: Step4Props) {
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast({ title: 'Permission required', preset: 'error' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelfieImage(result.assets[0].uri);
    }
  };

  return (
    <View>
      <Text className="text-xl font-bold text-gray-800 mb-2">Take a Selfie</Text>
      <Text className="text-gray-600 mb-6">Take a clear selfie holding your ID next to your face</Text>
      <TouchableOpacity
        className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-8 items-center"
        onPress={pickImage}
        activeOpacity={0.7}
      >
        {selfieImage ? (
          <Image source={{ uri: selfieImage }} className="w-48 h-48 rounded-full" resizeMode="cover" />
        ) : (
          <>
            <Ionicons name="camera-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-600 mt-4">Tap to take selfie</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}
