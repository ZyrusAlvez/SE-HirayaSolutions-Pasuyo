import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../utils/supabase';
import * as ImagePicker from 'expo-image-picker';
import { toast } from '../utils/toast';
import { validateImageAsset } from '../utils/imageValidation';
import ProfileHeader from '../components/profile/ProfileHeader';
import AvatarPicker from '../components/profile/AvatarPicker';
import VerificationBadge from '../components/profile/VerificationBadge';
import ProfileInfoCard from '../components/profile/ProfileInfoCard';
import SkeletonLoading from '../components/profile/SkeletonLoading';

const DEFAULT_AVATAR = require('../assets/images/default_profile.jpg');

type VerificationStatus = 'verified' | 'pending' | 'not_verified';
type ProfileInfo = {
  gender?: string;
  date_of_birth?: string;
  address_province?: string;
  address_city?: string;
  address_barangay?: string;
};

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
  const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null);

  const { width } = useWindowDimensions();
  const isLarge = width >= 768;
  const contentWidth = isLarge ? Math.min(width * 0.55, 640) : undefined;
  const isDirty = displayName !== originalName || !!pendingImageUri;

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata.name || user.user_metadata.full_name || '';
        setDisplayName(name);
        setOriginalName(name);
        setEmail(user.email || '');
        const url = user.user_metadata.custom_avatar_url || user.user_metadata.avatar_url;
        if (url && url !== 'default') setAvatarUrl({ uri: url });

        const { data: profile } = await supabase
          .from('profiles')
          .select('verified, pending_verification, gender, date_of_birth, address_province, address_city, address_barangay, first_name, last_name')
          .eq('id', user.id)
          .single();

        if (profile) {
          if (profile.verified) {
            setVerificationStatus('verified');
            const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
            setDisplayName(fullName);
            setOriginalName(fullName);
            setProfileInfo({
              gender: profile.gender,
              date_of_birth: profile.date_of_birth,
              address_province: profile.address_province,
              address_city: profile.address_city,
              address_barangay: profile.address_barangay,
            });
          } else if (profile.pending_verification) {
            setVerificationStatus('pending');
          } else {
            setVerificationStatus('not_verified');
          }
        }
      }
    } catch {
      toast({ title: 'Failed to load profile', preset: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { toast({ title: 'Permission required', preset: 'error' }); return; }

    let result;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
    } catch {
      toast({ title: 'Only JPG, PNG, or WEBP images are allowed', preset: 'error' }); return;
    }

    if (!result.canceled) {
      const asset = result.assets[0];
      const validation = await validateImageAsset(asset);
      if (!validation.ok) { toast({ title: validation.error, preset: 'error' }); return; }
      setPendingImageUri(asset.uri);
      setAvatarUrl({ uri: asset.uri });
    }
  };

  const uploadAvatar = async (uri: string, name: string, userEmail: string): Promise<string> => {
    const safeName = name.trim().replace(/\s+/g, '_');
    const safeEmail = userEmail.replace(/[@.]/g, '_');
    const path = `profile image/${safeName}_${safeEmail}.jpg`;
    const response = await fetch(uri);
    const blob = await response.blob();
    const { error } = await supabase.storage.from('avatars').upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    });
    if (error) throw error;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  };

  const handleSave = async () => {
    if (!displayName.trim()) { toast({ title: 'Display name is required', preset: 'error' }); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');
      const updates: Record<string, string> = { name: displayName };
      if (pendingImageUri) {
        const finalAvatarUrl = await uploadAvatar(pendingImageUri, displayName, user.email || '');
        setPendingImageUri(null);
        setAvatarUrl({ uri: finalAvatarUrl });
        updates.custom_avatar_url = finalAvatarUrl;
        await supabase.from('profiles').update({ avatar_url: finalAvatarUrl }).eq('id', user.id);
      }
      const { error } = await supabase.auth.updateUser({ data: updates });
      if (error) throw error;
      toast({ title: 'Profile updated', preset: 'done' });
      setOriginalName(displayName);
      setPendingImageUri(null);
    } catch {
      toast({ title: 'Failed to update profile', preset: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) { toast({ title: 'Logout failed', preset: 'error' }); }
    else { router.replace('/login'); }
  };

  if (loading) {
    return <SkeletonLoading contentWidth={contentWidth} isLarge={isLarge} />;
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120, alignItems: isLarge ? 'center' : undefined }}>
        <ProfileHeader contentWidth={contentWidth} onBack={() => router.replace('/')} />

        {/* Avatar — overlaps header */}
        <View style={{ width: contentWidth }} className="items-center -mt-14 mb-6">
          <AvatarPicker avatarUrl={avatarUrl} size={isLarge ? 140 : 112} onPress={pickImage} />
          <Text className="text-xl font-bold text-gray-800 mt-3">{displayName || 'No name set'}</Text>
          <Text className="text-sm text-gray-400 mt-0.5">{email}</Text>
          <VerificationBadge status={verificationStatus} />
        </View>

        <ProfileInfoCard
          contentWidth={contentWidth}
          isLarge={isLarge}
          verificationStatus={verificationStatus}
          profileInfo={profileInfo}
          displayName={displayName}
          email={email}
          onNameChange={setDisplayName}
          onChangePassword={() => router.push({ pathname: '/reset-password', params: { from: 'profile', email } })}
          onVerify={() => router.push('/verify')}
        />
      </ScrollView>

      {/* Actions — pinned to bottom */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: Platform.OS === 'web' ? 16 : 32, paddingTop: 12, backgroundColor: '#F9FAFB', alignItems: isLarge ? 'center' : undefined }}>
        <View style={{ width: contentWidth ?? '100%' }}>
          {isDirty && (
            <TouchableOpacity
              className="bg-[#FEA405] py-4 rounded-2xl mb-3"
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text className="text-white text-base font-semibold text-center">
                {saving ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            className="bg-white border border-red-300 py-4 rounded-2xl flex-row items-center justify-center"
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text className="text-red-500 text-base font-semibold ml-2">Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
