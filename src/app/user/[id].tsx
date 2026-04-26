import { useState, useEffect } from 'react';
import { View, Text, Image, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getDisplayProfile } from '@/models/profileModel';
import type { DisplayProfile } from '@/models/profileModel';

const DEFAULT_AVATAR = require('../../assets/images/default_profile.jpg');

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<DisplayProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getDisplayProfile(id).then((data) => {
      setProfile(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#FEA405" />
      </View>
    );
  }

  const avatarSource = profile?.avatarUrl ? { uri: profile.avatarUrl } : DEFAULT_AVATAR;

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>User Profile</Text>
      </View>

      <View style={{ flex: 1, alignItems: 'center', paddingTop: 48 }}>
        <Image source={avatarSource} style={{ width: 112, height: 112, borderRadius: 56 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827' }}>
            {profile?.name ?? 'Unknown'}
          </Text>
          {profile?.verified && <MaterialIcons name="verified" size={20} color="#1D9BF0" />}
        </View>
      </View>
    </View>
  );
}
