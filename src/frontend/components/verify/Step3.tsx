import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { toast } from 'burnt';

interface Step3Props {
  idImage: string | null;
  setIdImage: (uri: string) => void;
}

export default function Step3({ idImage, setIdImage }: Step3Props) {
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast({ title: 'Permission required', preset: 'error' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.8,
    });

    if (!result.canceled) {
      setIdImage(result.assets[0].uri);
    }
  };

  return (
    <View>
      <Text className="text-xl font-bold text-gray-800 mb-2">Upload ID Photo</Text>
      <Text className="text-gray-600 mb-6">Take a clear photo of your government-issued ID</Text>
      <TouchableOpacity
        className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-8 items-center"
        onPress={pickImage}
        activeOpacity={0.7}
      >
        {idImage ? (
          <Image source={{ uri: idImage }} className="w-full h-48 rounded-xl" resizeMode="cover" />
        ) : (
          <>
            <Ionicons name="card-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-600 mt-4">Tap to upload ID</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}
