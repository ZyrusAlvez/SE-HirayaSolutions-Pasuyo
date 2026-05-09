import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Platform, ActivityIndicator, KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { toast } from '../utils/toast';
import { postErrand } from '../controllers/errandController';
import TextInput from '../view/components/TextInput';
import TaskType from '../view/presentation/post-errand/TaskType';
import LocationPicker from '../view/presentation/post-errand/LocationPicker';
import Budget from '../view/presentation/post-errand/Budget';
import Deadline from '../view/presentation/post-errand/Deadline';
import ImageUploader from '../view/presentation/post-errand/ImageUploader';
import LocationMap from '../view/presentation/post-errand/LocationMap';
import AddressDetails from '../view/presentation/post-errand/AddressDetails';
import Header from '../view/components/Header';
import NavBar from '../view/components/NavBar';
import { useProfile } from '../context/ProfileContext';

const ACCENT = '#FEA405';

export default function PostErrandScreen() {
  const router = useRouter();
  const { avatarUrl, verificationStatus } = useProfile();
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

  const handleSubmit = async () => {
    setSubmitting(true);
    const result = await postErrand(
      { title, description, isRemote, pinnedLocation, addressDetails, budget, deadline, images },
    );
    setSubmitting(false);
    if (!result.success) {
      if (result.error) toast({ title: result.error, preset: 'error' });
      return;
    }
    toast({ title: 'Errand posted!', preset: 'done' });
    router.replace('/');
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header avatarUrl={avatarUrl} verificationStatus={verificationStatus} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View style={{ alignSelf: 'center', width: '100%', maxWidth: isLarge ? 640 : undefined, paddingHorizontal: 24, paddingTop: 16 }}>
          <TextInput
            testID="post-errand-title"
            label="Title"
            required
            placeholder="e.g. Deliver documents to Makati"
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            testID="post-errand-description"
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
            testID="post-errand-submit"
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
      <NavBar />
    </KeyboardAvoidingView>
  );
}
