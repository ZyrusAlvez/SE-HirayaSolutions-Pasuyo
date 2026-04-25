import { View, Text, TouchableOpacity, ActivityIndicator, Modal, Pressable } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { deleteErrand, cancelErrand } from '@/controllers/errandController';
import { toast } from '@/utils/toast';

const ACCENT = '#FEA405';

interface Props {
  errandId: string;
  status: string;
  isEditing: boolean;
  onEditToggle: () => void;
}

export default function OwnerActions({ errandId, status, isEditing, onEditToggle }: Props) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

<<<<<<< HEAD
  const handleCancel = async () => {
    setCancelling(true);
    const result = await cancelErrand(errandId);
=======
  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteErrand(errandId, status);
>>>>>>> a673190613b66e7bf3ddbe3997b32754c19e02b3
    if (!result.success) {
      setConfirmVisible(false);
      toast({ title: result.error, preset: 'error' });
      setCancelling(false);
    } else {
      setConfirmVisible(false);
      toast({ title: 'Errand cancelled', preset: 'done' });
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
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>Cancel Errand</Text>
          <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 20 }}>This will cancel the errand and notify any assigned runner.</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <TouchableOpacity
              testID="cancel-errand-dismiss-btn"
              onPress={() => setConfirmVisible(false)}
              disabled={cancelling}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center' }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280' }}>Go Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="cancel-errand-confirm-btn"
              onPress={handleCancel}
              disabled={cancelling}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center' }}
              activeOpacity={0.8}
            >
              {cancelling
                ? <ActivityIndicator size="small" color="white" />
                : <Text style={{ fontSize: 13, fontWeight: '600', color: 'white' }}>Confirm</Text>
              }
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <TouchableOpacity
<<<<<<< HEAD
        testID="edit-errand-btn"
        onPress={onEditToggle}
=======
        onPress={() => {
          if (!isEditing && status === 'In Progress') {
            toast({ title: 'This errand has already been accepted and cannot be edited.', preset: 'error' });
            return;
          }
          onEditToggle();
        }}
>>>>>>> a673190613b66e7bf3ddbe3997b32754c19e02b3
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
<<<<<<< HEAD
        testID="cancel-errand-btn"
        onPress={() => setConfirmVisible(true)}
        disabled={cancelling}
=======
        onPress={() => {
          if (status === 'In Progress') {
            toast({ title: 'This errand has already been accepted and cannot be deleted.', preset: 'error' });
            return;
          }
          setConfirmVisible(true);
        }}
        disabled={deleting}
>>>>>>> a673190613b66e7bf3ddbe3997b32754c19e02b3
        style={{
          flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          gap: 6, paddingVertical: 12, borderRadius: 14,
          backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
        }}
        activeOpacity={0.8}
      >
        {cancelling
          ? <ActivityIndicator size="small" color="#EF4444" />
          : <>
              <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#EF4444' }}>Cancel</Text>
            </>
        }
      </TouchableOpacity>
    </View>
    </>
  );
}
