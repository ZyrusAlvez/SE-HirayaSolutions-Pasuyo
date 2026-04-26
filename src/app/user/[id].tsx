import { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, Pressable, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getUserProfile } from '@/controllers/profileController';
import type { UserProfile } from '@/controllers/profileController';
import VerificationBadge from '@/view/components/VerificationBadge';
import UserInfoCard from '@/view/presentation/user/UserInfoCard';
import ErrandActivityCard from '@/view/presentation/profile/ErrandActivityCard';

const DEFAULT_AVATAR = require('../../assets/images/default_profile.jpg');

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();
  const isLarge = width >= 768;
  const contentWidth = isLarge ? Math.min(width * 0.55, 640) : undefined;

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

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>User Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: isLarge ? 'center' : undefined, paddingBottom: 48 }}>
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

        {profile && (
          <UserInfoCard
            profile={profile}
            contentWidth={contentWidth}
            isLarge={isLarge}
          />
        )}

        <ErrandActivityCard
          completedErrands={profile?.completedErrands ?? 0}
          postedCompleted={profile?.postedCompleted ?? 0}
          rating={profile?.rating ?? null}
          contentWidth={contentWidth}
          isLarge={isLarge}
        />
      </ScrollView>
    </View>
  );
}
