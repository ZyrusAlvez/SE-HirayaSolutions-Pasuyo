import { View, Text, TouchableOpacity, ActivityIndicator, Modal, Pressable } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { toast } from '../../utils/toast';

const ACCENT = '#FEA405';

interface Props {
  errandId: string;
  isEditing: boolean;
  onEditToggle: () => void;
}

export default function OwnerActions({ errandId, isEditing, onEditToggle }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.from('errands').delete().eq('id', errandId);
    if (error) {
      toast({ title: 'Failed to delete errand', preset: 'error' });
      setDeleting(false);
    } else {
      setConfirmVisible(false);
      toast({ title: 'Errand deleted', preset: 'done' });
      router.canGoBack() ? router.back() : router.replace('/');
    }
  };

  return (
    <>
    <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' }}
        onPress={() => !deleting && setConfirmVisible(false)}
      >
        <Pressable style={{
          backgroundColor: 'white', borderRadius: 20, padding: 24, width: 300,
          shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 10,
          gap: 6,
        }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>Delete Errand</Text>
          <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 20 }}>This action cannot be undone.</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <TouchableOpacity
              onPress={() => setConfirmVisible(false)}
              disabled={deleting}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center' }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              disabled={deleting}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center' }}
              activeOpacity={0.8}
            >
              {deleting
                ? <ActivityIndicator size="small" color="white" />
                : <Text style={{ fontSize: 13, fontWeight: '600', color: 'white' }}>Delete</Text>
              }
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <TouchableOpacity
        onPress={onEditToggle}
        style={{
          flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          gap: 6, paddingVertical: 12, borderRadius: 14,
          backgroundColor: isEditing ? '#F3F4F6' : '#FFF7ED',
          borderWidth: 1, borderColor: isEditing ? '#E5E7EB' : '#FED7AA',
        }}
        activeOpacity={0.8}
      >
        <Ionicons name={isEditing ? 'close-outline' : 'create-outline'} size={16} color={isEditing ? '#6B7280' : ACCENT} />
        <Text style={{ fontSize: 13, fontWeight: '600', color: isEditing ? '#6B7280' : ACCENT }}>
          {isEditing ? 'Cancel' : 'Edit'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setConfirmVisible(true)}
        disabled={deleting}
        style={{
          flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          gap: 6, paddingVertical: 12, borderRadius: 14,
          backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
        }}
        activeOpacity={0.8}
      >
        {deleting
          ? <ActivityIndicator size="small" color="#EF4444" />
          : <>
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#EF4444' }}>Delete</Text>
            </>
        }
      </TouchableOpacity>
    </View>
    </>
  );
}
