import { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getUserProfile } from '@/controllers/profileController';
import type { UserProfile } from '@/controllers/profileController';
import VerificationBadge from '@/view/components/VerificationBadge';
import UserProfileHeader from '@/view/presentation/user/UserProfileHeader';
import UserInfoCard from '@/view/presentation/user/UserInfoCard';
import UserProfileSkeleton from '@/view/presentation/user/UserProfileSkeleton';
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
      <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        <UserProfileHeader />
        <ScrollView contentContainerStyle={{ alignItems: isLarge ? 'center' : undefined, paddingBottom: 48 }}>
          <UserProfileSkeleton contentWidth={contentWidth} isLarge={isLarge} />
        </ScrollView>
      </View>
    );
  }

  const avatarSource = profile?.avatarUrl ? { uri: profile.avatarUrl } : DEFAULT_AVATAR;

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <UserProfileHeader userName={profile?.name} userId={id} />

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
