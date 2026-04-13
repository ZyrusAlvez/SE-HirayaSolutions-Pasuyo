import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/utils/supabase';
import { toast } from '@/utils/toast';
import TextInput from '@/view/components/TextInput';
import Budget from '@/view/presentation/post-errand/Budget';
import Deadline from '@/view/presentation/post-errand/Deadline';
import ImageUploader from '@/view/presentation/post-errand/ImageUploader';
import AddressDetails from '@/view/presentation/post-errand/AddressDetails';
import TaskType from '@/view/presentation/post-errand/TaskType';
import LocationPicker from '@/view/presentation/post-errand/LocationPicker';
import LocationMap from '@/view/presentation/post-errand/LocationMap';

const ACCENT = '#FEA405';

interface ErrandEditData {
  id: string;
  title: string;
  description: string;
  is_remote: boolean;
  budget?: number;
  deadline?: string;
  location_name?: string;
  location_lat?: number | null;
  location_lng?: number | null;
  address_details?: string;
  images?: string[];
}

interface Props {
  errand: ErrandEditData;
  onSaved: (updated: Partial<ErrandEditData>) => void;
  onCancel: () => void;
}

export default function EditErrandSheet({ errand, onSaved, onCancel }: Props) {
  const [title, setTitle] = useState(errand.title);
  const [description, setDescription] = useState(errand.description);
  const [isRemote, setIsRemote] = useState(errand.is_remote);
  const [budget, setBudget] = useState(errand.budget != null ? String(errand.budget) : '');
  const [deadline, setDeadline] = useState<Date | null>(errand.deadline ? new Date(errand.deadline) : null);
  const [images, setImages] = useState<string[]>(errand.images ?? []);
  const [imageErrors, setImageErrors] = useState<string[]>([]);
  const [addressDetails, setAddressDetails] = useState(errand.address_details ?? '');
  const [pinnedLocation, setPinnedLocation] = useState<{ lat: number; lng: number; name: string } | null>(
    errand.location_lat && errand.location_lng && errand.location_name
      ? { lat: errand.location_lat, lng: errand.location_lng, name: errand.location_name }
      : null
  );
  const [showMap, setShowMap] = useState(false);
  const [saving, setSaving] = useState(false);

  const uploadNewImages = async (userId: string): Promise<string[]> => {
    const urls: string[] = [];
    for (const uri of images) {
      if (uri.startsWith('http')) { urls.push(uri); continue; }
      const response = await fetch(uri);
      const blob = await response.blob();
      const ext = blob.type.split('/')[1] ?? 'jpg';
      const fileName = `${userId}/${errand.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('errand-images').upload(fileName, blob, { contentType: blob.type });
      if (!error) {
        const { data } = supabase.storage.from('errand-images').getPublicUrl(fileName);
        urls.push(data.publicUrl);
      }
    }
    return urls;
  };

  const handleSave = async () => {
    if (!title.trim()) return Alert.alert('Required', 'Title cannot be empty.');
    if (!description.trim()) return Alert.alert('Required', 'Description cannot be empty.');
    if (!isRemote && !pinnedLocation) return Alert.alert('Required', 'Please pin a location for onsite errands.');

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const imageUrls = await uploadNewImages(user.id);

      const dbUpdates = {
        title: title.trim(),
        description: description.trim(),
        is_remote: isRemote,
        budget: budget ? parseFloat(budget) : null,
        deadline: deadline ? deadline.toISOString() : null,
        location_lat: pinnedLocation?.lat ?? null,
        location_lng: pinnedLocation?.lng ?? null,
        location_name: pinnedLocation?.name ?? null,
        address_details: addressDetails.trim() || null,
        images: imageUrls,
      };

      const { error } = await supabase.from('errands').update(dbUpdates).eq('id', errand.id);
      if (error) throw error;

      toast({ title: 'Errand updated!', preset: 'done' });
      onSaved({
        title: dbUpdates.title,
        description: dbUpdates.description,
        is_remote: dbUpdates.is_remote,
        budget: dbUpdates.budget ?? undefined,
        deadline: dbUpdates.deadline ?? undefined,
        location_lat: dbUpdates.location_lat,
        location_lng: dbUpdates.location_lng,
        location_name: dbUpdates.location_name ?? undefined,
        address_details: dbUpdates.address_details ?? undefined,
        images: dbUpdates.images,
      });
    } catch (e: any) {
      toast({ title: e.message ?? 'Something went wrong', preset: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>Edit Errand</Text>
        <TouchableOpacity onPress={onCancel}>
          <Ionicons name="close" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <TextInput label="Title" required placeholder="e.g. Deliver documents to Makati" value={title} onChangeText={setTitle} />
      <TextInput label="Description" required placeholder="Describe the task in detail..." value={description} onChangeText={setDescription} multiline numberOfLines={4} textAlignVertical="top" style={{ minHeight: 100 }} />

      <TaskType isRemote={isRemote} onChange={setIsRemote} />

      {!isRemote && (
        <>
          <LocationPicker pinnedLocation={pinnedLocation} onPress={() => setShowMap(true)} />
          <AddressDetails value={addressDetails} onChange={setAddressDetails} />
        </>
      )}

      <Budget value={budget} onChange={setBudget} />
      <Deadline value={deadline} onChange={setDeadline} />
      <ImageUploader images={images} errors={imageErrors} onChange={setImages} onErrors={setImageErrors} />

      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        style={{ backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 }}
        activeOpacity={0.85}
      >
        {saving
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>Save Changes</Text>
        }
      </TouchableOpacity>

      <LocationMap
        visible={showMap}
        onClose={() => setShowMap(false)}
        initialCoords={pinnedLocation}
        pinnedLocation={pinnedLocation}
        onPin={(lat, lng, name) => setPinnedLocation({ lat, lng, name })}
      />
    </View>
  );
}
