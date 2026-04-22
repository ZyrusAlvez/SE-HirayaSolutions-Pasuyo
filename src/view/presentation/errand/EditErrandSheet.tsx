import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { editErrand } from '@/controllers/errandController';
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

  const handleSave = async () => {
    setSaving(true);
    const result = await editErrand(errand.id, {
      title, description, isRemote, budget, deadline, images, addressDetails, pinnedLocation,
    });
    setSaving(false);
    if (!result.success) {
      toast({ title: result.error, preset: 'error' });
      return;
    }
    toast({ title: 'Errand updated!', preset: 'done' });
    onSaved({
      title: result.data!.title,
      description: result.data!.description,
      is_remote: result.data!.is_remote,
      budget: result.data!.budget ?? undefined,
      deadline: result.data!.deadline ?? undefined,
      location_lat: result.data!.location_lat,
      location_lng: result.data!.location_lng,
      location_name: result.data!.location_name ?? undefined,
      address_details: result.data!.address_details ?? undefined,
      images: result.data!.images,
    });
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
