import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Platform, Alert, ActivityIndicator, KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { toast } from '../lib/toast';
import { postErrandStore } from '../lib/postErrandStore';
import { supabase } from '../lib/supabase';
import TextInput from '../components/ui/TextInput';
import TaskType from '../components/post-errand/TaskType';
import LocationPicker from '../components/post-errand/LocationPicker';
import Budget from '../components/post-errand/Budget';
import Deadline from '../components/post-errand/Deadline';
import ImageUploader from '../components/post-errand/ImageUploader';
import LocationMap from '../components/post-errand/LocationMap';
import AddressDetails from '../components/post-errand/AddressDetails';

const ACCENT = '#FEA405';

export default function PostErrandScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLarge = width >= 768;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [imageErrors, setImageErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [pinnedLocation, setPinnedLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [addressDetails, setAddressDetails] = useState('');
  const [showMapModal, setShowMapModal] = useState(false);
  const mapInitRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setCurrentLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  const handleOpenMap = () => {
    if (!mapInitRef.current) {
      mapInitRef.current = pinnedLocation ?? currentLocation ?? { lat: 14.5995, lng: 120.9842 };
    }
    setShowMapModal(true);
  };

  const handlePin = useCallback((lat: number, lng: number, name: string) => {
    setPinnedLocation({ lat, lng, name });
  }, []);

  const uploadImages = async (userId: string, errandId: string): Promise<string[]> => {
    const urls: string[] = [];
    for (const uri of images) {
      const response = await fetch(uri);
      const blob = await response.blob();
      const ext = blob.type.split('/')[1] ?? 'jpg';
      const fileName = `${userId}/${errandId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('errand-images').upload(fileName, blob, {
        contentType: blob.type,
      });
      if (!error) {
        const { data } = supabase.storage.from('errand-images').getPublicUrl(fileName);
        urls.push(data.publicUrl);
      }
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!title.trim()) return Alert.alert('Required', 'Please enter a title.');
    if (!description.trim()) return Alert.alert('Required', 'Please enter a description.');
    if (!isRemote && !pinnedLocation) return Alert.alert('Required', 'Please pin a location for onsite errands.');

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: inserted, error: insertError } = await supabase.from('errands').insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        is_remote: isRemote,
        location_lat: pinnedLocation?.lat ?? null,
        location_lng: pinnedLocation?.lng ?? null,
        location_name: pinnedLocation?.name ?? null,
        address_details: addressDetails.trim() || null,
        budget: budget ? parseFloat(budget) : null,
        deadline: deadline ? deadline.toISOString() : null,
        images: [],
      }).select('id').single();

      if (insertError) throw insertError;

      if (images.length > 0) {
        const imageUrls = await uploadImages(user.id, inserted.id);
        await supabase.from('errands').update({ images: imageUrls }).eq('id', inserted.id);
      }

      postErrandStore.set({ expandId: inserted.id, tab: isRemote ? 'remote' : 'onsite' });
      toast({ title: 'Errand posted!', preset: 'done' });
      router.replace('/');
    } catch (e: any) {
      toast({ title: e.message ?? 'Something went wrong', preset: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View className={`bg-white px-6 pb-4 flex-row items-center border-b border-gray-100 ${Platform.OS !== 'web' ? 'pt-12' : 'pt-4'}`}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Post an Errand</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View style={{ alignSelf: 'center', width: '100%', maxWidth: isLarge ? 640 : undefined, paddingHorizontal: 24, paddingTop: 16 }}>
          <TextInput
            label="Title"
            required
            placeholder="e.g. Deliver documents to Makati"
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            label="Description"
            required
            placeholder="Describe the task in detail..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{ minHeight: 100 }}
          />

          <TaskType isRemote={isRemote} onChange={setIsRemote} />

          {!isRemote && (
            <>
              <LocationPicker pinnedLocation={pinnedLocation} onPress={handleOpenMap} />
              <AddressDetails value={addressDetails} onChange={setAddressDetails} />
            </>
          )}

          <Budget value={budget} onChange={setBudget} />

          <Deadline value={deadline} onChange={setDeadline} />

          <ImageUploader
            images={images}
            errors={imageErrors}
            onChange={setImages}
            onErrors={setImageErrors}
          />

          <View className="mb-4" />

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            className="rounded-2xl py-4 items-center mb-8"
            style={{ backgroundColor: ACCENT }}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Post Errand</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LocationMap
        visible={showMapModal}
        onClose={() => setShowMapModal(false)}
        initialCoords={mapInitRef.current}
        pinnedLocation={pinnedLocation}
        onPin={handlePin}
      />
    </KeyboardAvoidingView>
  );
}
