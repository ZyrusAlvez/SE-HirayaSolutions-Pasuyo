import { View, Text, Image, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { toast } from '../../utils/toast';
import { validateImageAsset, ACCEPTED_EXTENSIONS, MAX_FILE_SIZE_MB } from '../../utils/imageValidation';

interface Props {
  images: string[];
  errors: string[];
  onChange: (images: string[]) => void;
  onErrors: (errors: string[]) => void;
}

export default function ImageUploader({ images, errors, onChange, onErrors }: Props) {
  const MAX_IMAGES = 5;
  const remaining = MAX_IMAGES - images.length;

  const pickImages = async () => {
    if (remaining <= 0) return;
    let result;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });
    } catch (e: any) {
      const msg = 'Some files could not be read. Use JPG, PNG, or WebP.';
      onErrors([msg]);
      toast({ title: msg, preset: 'error' });
      return;
    }
    if (result.canceled) return;

    const errs: string[] = [];
    const validUris: string[] = [];
    for (const asset of result.assets.slice(0, remaining)) {
      const validation = await validateImageAsset(asset);
      if (!validation.ok) errs.push(validation.error);
      else validUris.push(asset.uri);
    }
    if (result.assets.length > remaining) {
      const msg = `Only ${remaining} more image${remaining === 1 ? '' : 's'} allowed. Extra selections were ignored.`;
      errs.push(msg);
      toast({ title: msg, preset: 'error' });
    }
    onErrors(errs);
    errs.filter(e => !e.includes('allowed')).forEach((err) => toast({ title: err, preset: 'error' }));
    if (validUris.length > 0) onChange([...images, ...validUris]);
  };

  return (
    <>
      <Text className="text-xs text-gray-500 mb-1 ml-1">Images</Text>
      <Text className="text-xs text-gray-400 mb-2 ml-1">
        {ACCEPTED_EXTENSIONS.join(', ')} · Max {MAX_FILE_SIZE_MB}MB per file · Up to {MAX_IMAGES} images
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-2">
        {images.map((uri, i) => (
          <View key={i} className="relative">
            <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 12 }} />
            <TouchableOpacity
              onPress={() => onChange(images.filter((_, idx) => idx !== i))}
              className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 items-center justify-center"
            >
              <Ionicons name="close" size={12} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
        {remaining > 0 && (
          <TouchableOpacity
            onPress={pickImages}
            className="w-20 h-20 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl items-center justify-center"
          >
            <Ionicons name="add" size={28} color="#9CA3AF" />
            <Text className="text-xs text-gray-400">{remaining} left</Text>
          </TouchableOpacity>
        )}
      </View>
      {errors.map((err, i) => (
        <View key={i} className="flex-row items-center mb-1">
          <Ionicons name="alert-circle" size={13} color="#EF4444" />
          <Text className="text-xs text-red-500 ml-1">{err}</Text>
        </View>
      ))}
    </>
  );
}
