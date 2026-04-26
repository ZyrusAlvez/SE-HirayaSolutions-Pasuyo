import { useState, useEffect } from 'react';
import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { toast } from '@/utils/toast';
import { getProfile, getAvatarImage, updateProfile, getUserProfile } from '@/controllers/profileController';
import type { VerificationStatus, ProfileData, UserProfile } from '@/controllers/profileController';
import { logout } from '@/controllers/authController';
import ProfileHeader from '@/view/presentation/profile/ProfileHeader';
import AvatarPicker from '@/view/presentation/profile/AvatarPicker';
import VerificationBadge from '@/view/components/VerificationBadge';
import ProfileInfoCard from '@/view/presentation/profile/ProfileInfoCard';
import SettingsCard from '@/view/presentation/profile/SettingsCard';
import SkeletonLoading from '@/view/presentation/profile/SkeletonLoading';
import ProfileActions from '@/view/presentation/profile/ProfileActions';
import ErrandActivityCard from '@/view/presentation/profile/ErrandActivityCard';

import DEFAULT_AVATAR from '../assets/images/default_profile.jpg';

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<any>(DEFAULT_AVATAR);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('not_verified');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [errandStats, setErrandStats] = useState<UserProfile | null>(null);

  const { width } = useWindowDimensions();
  const isLarge = width >= 768;
  const contentWidth = isLarge ? Math.min(width * 0.55, 640) : undefined;
  const isDirty = displayName !== originalName || !!pendingImageUri;

  useEffect(() => {
    getProfile().then((result) => {
      if (!result.success) {
        toast({ title: result.error, preset: 'error' });
      } else if (result.data) {
        const { id, displayName: name, email: mail, avatarUrl: url, verificationStatus: status } = result.data;
        setDisplayName(name);
        setOriginalName(name);
        setEmail(mail);
        if (url) setAvatarUrl({ uri: url });
        setVerificationStatus(status);
        setProfileData(result.data);
        getUserProfile(id).then((statsResult) => {
          if (statsResult.success) setErrandStats(statsResult.data);
        });
      }
      setLoading(false);
    });
  }, []);

  const handlePickAvatar = async () => {
    const result = await getAvatarImage();
    if (!result.success) {
      if (result.error) toast({ title: result.error, preset: 'error' });
      return;
    }
    setPendingImageUri(result.data);
    setAvatarUrl({ uri: result.data });
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updateProfile(displayName, pendingImageUri);
    setSaving(false);
    if (!result.success) {
      toast({ title: result.error, preset: 'error' });
      return;
    }
    if (result.data.finalAvatarUrl) {
      setAvatarUrl({ uri: result.data.finalAvatarUrl });
    }
    toast({ title: 'Profile updated', preset: 'done' });
    setOriginalName(displayName);
    setPendingImageUri(null);
  };

  const handleLogout = async () => {
    const result = await logout();
    if (!result.success) {
      toast({ title: result.error, preset: 'error' });
    } else {
      router.replace('/login');
    }
  };

  if (loading) {
    return <SkeletonLoading contentWidth={contentWidth} isLarge={isLarge} />;
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120, alignItems: isLarge ? 'center' : undefined }}>
        <ProfileHeader contentWidth={contentWidth} onBack={() => router.replace('/')} />

        <View style={{ width: contentWidth }} className="items-center -mt-14 mb-6">
          <AvatarPicker avatarUrl={avatarUrl} size={isLarge ? 140 : 112} onPress={handlePickAvatar} />
          <Text className="text-xl font-bold text-gray-800 mt-3">{displayName || 'No name set'}</Text>
          <VerificationBadge status={verificationStatus} />
        </View>

        <ProfileInfoCard
          contentWidth={contentWidth}
          isLarge={isLarge}
          verificationStatus={verificationStatus}
          profileInfo={profileData}
          displayName={displayName}
          email={email}
          onNameChange={setDisplayName}
        />

        {errandStats && (
          <ErrandActivityCard
            completedErrands={errandStats.completedErrands}
            postedCompleted={errandStats.postedCompleted}
            rating={errandStats.rating}
            contentWidth={contentWidth}
            isLarge={isLarge}
          />
        )}

        <SettingsCard
          contentWidth={contentWidth}
          isLarge={isLarge}
          verificationStatus={verificationStatus}
          onChangePassword={() => router.push({ pathname: '/reset-password', params: { from: 'profile' } })}
          onVerify={() => router.push('/verify')}
        />
      </ScrollView>

      <ProfileActions
        isDirty={isDirty}
        saving={saving}
        contentWidth={contentWidth}
        isLarge={isLarge}
        onSave={handleSave}
        onLogout={handleLogout}
      />
    </View>
  );
}
