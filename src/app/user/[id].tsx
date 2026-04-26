import { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getUserProfile } from '@/controllers/profileController';
import type { UserProfile } from '@/controllers/profileController';
import VerificationBadge from '@/view/components/VerificationBadge';
import ErrandActivityCard from '@/view/presentation/profile/ErrandActivityCard';

const DEFAULT_AVATAR = require('../../assets/images/default_profile.jpg');

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getUserProfile(id).then((result) => {
      if (result.success) setProfile(result.data);
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
  const address = [profile?.address_barangay, profile?.address_city, profile?.address_province].filter(Boolean).join(', ');

  const personalRows: { label: string; value: string }[] = [
    { label: 'Name', value: profile?.name ?? '—' },
    { label: 'Email', value: profile?.email ?? '—' },
    ...(profile?.verified ? [
      { label: 'Gender', value: profile.gender ?? '—' },
      { label: 'Date of Birth', value: profile.date_of_birth ?? '—' },
      { label: 'Address', value: address || '—' },
    ] : []),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>User Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 48 }}>
        <View style={{ alignItems: 'center', paddingTop: 40, marginBottom: 24 }}>
          <Image source={avatarSource} style={{ width: 112, height: 112, borderRadius: 56 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 16 }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827' }}>
              {profile?.name ?? 'Unknown'}
            </Text>
            {profile?.verified && <MaterialIcons name="verified" size={20} color="#1D9BF0" />}
          </View>
          <VerificationBadge status={profile?.verificationStatus ?? 'not_verified'} />
        </View>

        <View style={{ width: '100%', maxWidth: 480, paddingHorizontal: 16, gap: 16 }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Personal Information</Text>
            {personalRows.map(({ label, value }) => (
              <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                <Text style={{ fontSize: 14, color: '#9CA3AF' }}>{label}</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', flexShrink: 0, marginLeft: 16, textAlign: 'right' }} numberOfLines={2}>{value}</Text>
              </View>
            ))}
          </View>

          <ErrandActivityCard
            completedErrands={profile?.completedErrands ?? 0}
            postedCompleted={profile?.postedCompleted ?? 0}
            rating={profile?.rating ?? null}
          />
        </View>
      </ScrollView>
    </View>
  );
}
