import * as profileModel from '@/models/profileModel';
import { validateImageAsset } from '@/utils/imageValidation';
import * as ImagePicker from 'expo-image-picker';

export type VerificationStatus = 'verified' | 'pending' | 'not_verified';

export type ProfileInfo = {
  gender?: string;
  date_of_birth?: string;
  address_province?: string;
  address_city?: string;
  address_barangay?: string;
};

export type ProfileData = {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  verificationStatus: VerificationStatus;
  profileInfo: ProfileInfo | null;
};

type Result<T = void> = { success: true; data: T } | { success: false; error: string };

export const loadProfile = async (): Promise<Result<ProfileData | null>> => {
  const { data: { user } } = await profileModel.getUser();
  if (!user) return { success: true, data: null };

  const name = user.user_metadata.name || user.user_metadata.full_name || '';
  const rawUrl = user.user_metadata.custom_avatar_url || user.user_metadata.avatar_url;
  const avatarUrl = rawUrl && rawUrl !== 'default' ? rawUrl : null;

  const { data: profile } = await profileModel.getProfile(user.id);

  let displayName = name;
  let verificationStatus: VerificationStatus = 'not_verified';
  let profileInfo: ProfileInfo | null = null;

  if (profile) {
    if (profile.verified) {
      verificationStatus = 'verified';
      displayName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
      profileInfo = {
        gender: profile.gender,
        date_of_birth: profile.date_of_birth,
        address_province: profile.address_province,
        address_city: profile.address_city,
        address_barangay: profile.address_barangay,
      };
    } else if (profile.pending_verification) {
      verificationStatus = 'pending';
    }
  }

  return {
    success: true,
    data: { id: user.id, displayName, email: user.email || '', avatarUrl, verificationStatus, profileInfo },
  };
};

export const pickAvatar = async (): Promise<Result<string>> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return { success: false, error: 'Permission required' };

  let result;
  try {
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
  } catch {
    return { success: false, error: 'Only JPG, PNG, or WEBP images are allowed' };
  }

  if (result.canceled) return { success: false, error: '' };

  const asset = result.assets[0];
  const validation = await validateImageAsset(asset);
  if (!validation.ok) return { success: false, error: validation.error };

  return { success: true, data: asset.uri };
};

export const saveProfile = async (
  displayName: string,
  pendingImageUri: string | null,
): Promise<Result<{ finalAvatarUrl: string | null }>> => {
  if (!displayName.trim()) return { success: false, error: 'Display name is required' };

  const { data: { user } } = await profileModel.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const updates: Record<string, string> = { name: displayName };
  let finalAvatarUrl: string | null = null;

  if (pendingImageUri) {
    finalAvatarUrl = await profileModel.uploadAvatar(pendingImageUri, displayName, user.email || '');
    updates.custom_avatar_url = finalAvatarUrl;
    await profileModel.updateProfileAvatar(user.id, finalAvatarUrl);
  }

  const { error } = await profileModel.updateUserMeta(updates);
  if (error) return { success: false, error: 'Failed to update profile' };

  return { success: true, data: { finalAvatarUrl } };
};
