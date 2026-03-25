import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { toast } from '../../lib/toast';

const ACCENT = '#FEA405';

interface Props {
  errandId: string;
  isEditing: boolean;
  onEditToggle: () => void;
}

export default function OwnerActions({ errandId, isEditing, onEditToggle }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      'Delete Errand',
      'Are you sure you want to delete this errand? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const { error } = await supabase.from('errands').delete().eq('id', errandId);
            if (error) {
              toast({ title: 'Failed to delete errand', preset: 'error' });
              setDeleting(false);
            } else {
              toast({ title: 'Errand deleted', preset: 'done' });
              router.canGoBack() ? router.back() : router.replace('/');
            }
          },
        },
      ]
    );
  };

  return (
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
        onPress={handleDelete}
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
  );
}
