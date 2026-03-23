import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Platform, Image, Alert, ActivityIndicator, Modal, KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { toast } from 'burnt';
import { supabase } from '../lib/supabase';
import TextInput from '../components/ui/TextInput';
import DatePicker from '../components/ui/DatePicker';
import { validateImageAsset, ACCEPTED_EXTENSIONS, MAX_FILE_SIZE_MB } from '../lib/imageValidation';

let WebView: any;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

const ACCENT = '#FEA405';

function buildMapHtml(lat: number, lng: number, isNative: boolean) {
  const post = (msg: string) => isNative
    ? `window.ReactNativeWebView.postMessage(${msg})`
    : `window.parent.postMessage(${msg}, '*')`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js"></script>
  <style>body{margin:0}#map{height:100vh;width:100vw}</style>
</head>
<body>
<div id="map"></div>
<script>
  const map = L.map('map').setView([${lat}, ${lng}], 15);
  L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',{attribution:'© CartoDB'}).addTo(map);
  let marker = L.marker([${lat}, ${lng}], {draggable:true}).addTo(map);

  function sendLocation(lat, lng) {
    fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat='+lat+'&lon='+lng)
      .then(r=>r.json())
      .then(d=>{ ${post('JSON.stringify({lat, lng, name: d.display_name || \'\'})')}; })
      .catch(()=>{ ${post('JSON.stringify({lat, lng, name: \'\'})')}; });
  }

  sendLocation(${lat}, ${lng});
  marker.on('dragend', function(e){ const {lat,lng}=e.target.getLatLng(); sendLocation(lat,lng); });
  map.on('click', function(e){ marker.setLatLng(e.latlng); sendLocation(e.latlng.lat,e.latlng.lng); });
  const geocoder = L.Control.geocoder({defaultMarkGeocode:false}).addTo(map);
  geocoder.on('markgeocode', function(e){
    const {center}=e.geocode; marker.setLatLng(center); map.setView(center,16); sendLocation(center.lat,center.lng);
  });
</script>
</body>
</html>`;
}

function NativeErrandMap({ initialLat, initialLng, onPin }: {
  initialLat: number; initialLng: number;
  onPin: (lat: number, lng: number, name: string) => void;
}) {
  const htmlRef = useRef(buildMapHtml(initialLat, initialLng, true));
  return (
    <WebView
      source={{ html: htmlRef.current }}
      style={{ flex: 1 }}
      onMessage={(event: any) => {
        try {
          const d = JSON.parse(event.nativeEvent.data);
          onPin(d.lat, d.lng, d.name ?? '');
        } catch {}
      }}
    />
  );
}

function WebErrandMap({ initialLat, initialLng, onPin }: {
  initialLat: number; initialLng: number;
  onPin: (lat: number, lng: number, name: string) => void;
}) {
  const srcRef = useRef<string | null>(null);
  const onPinRef = useRef(onPin);
  useEffect(() => { onPinRef.current = onPin; }, [onPin]);

  if (!srcRef.current) {
    const blob = new Blob([buildMapHtml(initialLat, initialLng, false)], { type: 'text/html' });
    srcRef.current = URL.createObjectURL(blob);
  }

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data);
        if (d.lat && d.lng) onPinRef.current(d.lat, d.lng, d.name ?? '');
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return <iframe src={srcRef.current!} style={{ flex: 1, border: 'none', width: '100%', height: '100%' }} />;
}

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

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled) return;

    const errors: string[] = [];
    const validUris: string[] = [];
    for (const asset of result.assets) {
      const validation = await validateImageAsset(asset);
      if (!validation.ok) errors.push(validation.error);
      else validUris.push(asset.uri);
    }
    setImageErrors(errors);
    errors.forEach((err) => toast({ title: err, preset: 'error' }));
    if (validUris.length > 0) setImages((prev) => [...prev, ...validUris]);
  };

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

      // Insert first to get the errand ID
      const { data: inserted, error: insertError } = await supabase.from('errands').insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        is_remote: isRemote,
        location_lat: pinnedLocation?.lat ?? null,
        location_lng: pinnedLocation?.lng ?? null,
        location_name: pinnedLocation?.name ?? null,
        budget: budget ? parseFloat(budget) : null,
        deadline: deadline ? deadline.toISOString() : null,
        images: [],
      }).select('id').single();

      if (insertError) throw insertError;

      // Upload images under userId/errandId/ then update the row
      if (images.length > 0) {
        const imageUrls = await uploadImages(user.id, inserted.id);
        await supabase.from('errands').update({ images: imageUrls }).eq('id', inserted.id);
      }

      toast({ title: 'Errand posted!', preset: 'done' });
      router.back();
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

        <Text className="text-xs text-gray-500 mb-1 ml-1">Task Type *</Text>
        <View className="flex-row mb-4 gap-3">
          {(['Remote', 'Onsite'] as const).map((type) => {
            const selected = type === 'Remote' ? isRemote : !isRemote;
            return (
              <TouchableOpacity
                key={type}
                onPress={() => setIsRemote(type === 'Remote')}
                className={`flex-1 py-4 rounded-2xl border items-center bg-gray-50 ${selected ? 'border-[#FEA405]' : 'border-gray-200'}`}
              >
                <Text className={`text-base font-semibold ${selected ? 'text-[#FEA405]' : 'text-gray-400'}`}>{type}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {!isRemote && (
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1 ml-1">Location *</Text>
            <TouchableOpacity
              onPress={handleOpenMap}
              className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 flex-row items-center"
            >
              <Ionicons name="location-outline" size={18} color={ACCENT} />
              <Text className={`ml-2 text-base flex-1 ${pinnedLocation ? 'text-gray-900' : 'text-gray-400'}`} numberOfLines={1}>
                {pinnedLocation?.name || 'Tap to pin location on map'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        )}

        <TextInput
          label="Budget (₱)"
          placeholder="e.g. 500"
          value={budget}
          onChangeText={(v) => setBudget(v.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
        />

        <DatePicker
          label="Deadline"
          value={deadline}
          onChange={setDeadline}
          minimumDate={new Date()}
          placeholder="Select deadline"
        />

        <Text className="text-xs text-gray-500 mb-1 ml-1">Images</Text>
        <Text className="text-xs text-gray-400 mb-2 ml-1">
          {ACCEPTED_EXTENSIONS.join(', ')} · Max {MAX_FILE_SIZE_MB}MB per file
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-2">
          {images.map((uri, i) => (
            <View key={i} className="relative">
              <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 12 }} />
              <TouchableOpacity
                onPress={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 items-center justify-center"
              >
                <Ionicons name="close" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={pickImages}
            className="w-20 h-20 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl items-center justify-center"
          >
            <Ionicons name="add" size={28} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
        {imageErrors.map((err, i) => (
          <View key={i} className="flex-row items-center mb-1">
            <Ionicons name="alert-circle" size={13} color="#EF4444" />
            <Text className="text-xs text-red-500 ml-1">{err}</Text>
          </View>
        ))}
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

      <Modal visible={showMapModal} animationType="slide" onRequestClose={() => setShowMapModal(false)}>
        <View className="flex-1 bg-white">
          <View style={{ alignSelf: 'center', width: '100%', maxWidth: isLarge ? 960 : undefined }} className="px-4 pt-4 pb-3 flex-row items-center border-b border-gray-100">
            <TouchableOpacity onPress={() => setShowMapModal(false)} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text className="text-lg font-bold flex-1">Pin Location</Text>
            <TouchableOpacity
              onPress={() => setShowMapModal(false)}
              className="px-4 py-2 rounded-xl"
              style={{ backgroundColor: ACCENT }}
            >
              <Text className="text-white font-semibold">Confirm</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, alignSelf: 'center', width: '100%', maxWidth: isLarge ? 960 : undefined }}>
            {mapInitRef.current && (
              Platform.OS === 'web' ? (
                <WebErrandMap
                  initialLat={mapInitRef.current.lat}
                  initialLng={mapInitRef.current.lng}
                  onPin={handlePin}
                />
              ) : (
                WebView && (
                  <NativeErrandMap
                    initialLat={mapInitRef.current.lat}
                    initialLng={mapInitRef.current.lng}
                    onPin={handlePin}
                  />
                )
              )
            )}
          </View>

          {pinnedLocation && (
            <View style={{ alignSelf: 'center', width: '100%', maxWidth: isLarge ? 960 : undefined }} className="px-4 py-3 border-t border-gray-100">
              <Text className="text-xs text-gray-500" numberOfLines={2}>{pinnedLocation.name}</Text>
            </View>
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
