import * as profileModel from '@/models/profileModel';
import type { VerificationStatus, ProfileData, VerifyFormState } from '@/models/profileModel';
import { validateImageAsset } from '@/utils/imageValidation';
import * as ImagePicker from 'expo-image-picker';

export type { VerificationStatus, ProfileData, VerifyFormState };

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
  let profileInfo: Partial<ProfileData> = {};

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
    data: { id: user.id, displayName, email: user.email || '', avatarUrl, verificationStatus, ...profileInfo },
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

export const validateVerifyStep = (step: number, s: VerifyFormState): string | null => {
  if (step === 1) {
    if (!s.firstName.trim()) return 'First name is required';
    if (!s.lastName.trim()) return 'Last name is required';
    if (!s.gender) return 'Gender is required';
    if (!s.dateOfBirth) return 'Date of birth is required';
  }
  if (step === 2) {
    if (!s.province) return 'Province is required';
    if (!s.city) return 'City is required';
    if (!s.barangay) return 'Barangay is required';
    if (s.addressType === 'House') {
      if (!s.houseNo.trim()) return 'House number is required';
      if (!s.street.trim()) return 'Street is required';
    }
    if (s.addressType === 'Apartment') {
      if (!s.buildingName.trim()) return 'Building name is required';
      if (!s.unitNo.trim()) return 'Unit number is required';
      if (!s.street.trim()) return 'Street is required';
    }
    if (s.addressType === 'Building') {
      if (!s.buildingName.trim()) return 'Building name is required';
      if (!s.floor.trim()) return 'Floor is required';
      if (!s.unitNo.trim()) return 'Unit number is required';
      if (!s.street.trim()) return 'Street is required';
    }
  }
  if (step === 3) {
    if (!s.utilityBillType) return 'Please select a bill type';
    if (!s.utilityBillFrontUri) return 'Front photo is required';
    if (!s.utilityBillBackUri) return 'Back photo is required';
  }
  if (step === 4) {
    if (!s.idType) return 'Please select an ID type';
    if (!s.idFrontUri) return 'Front photo is required';
    if (!s.idBackUri) return 'Back photo is required';
  }
  return null;
};

export const submitVerification = async (s: VerifyFormState): Promise<Result<void>> => {
  try {
    const { data: { user } } = await profileModel.getUser();
    if (!user) throw new Error('Not authenticated');

    if (!s.dateOfBirth || !s.province || !s.city || !s.barangay)
      throw new Error('Missing required fields');
    if (!s.utilityBillFrontUri || !s.utilityBillBackUri || !s.idFrontUri || !s.idBackUri)
      throw new Error('Missing required file uploads');

    const userId = user.id;
    await profileModel.archiveCurrentFiles(userId);

    const [utilityFrontUrl, utilityBackUrl, idFrontUrl, idBackUrl] = await Promise.all([
      profileModel.uploadVerificationFile(s.utilityBillFrontUri, `${userId}/current/utility-bill-front.jpg`),
      profileModel.uploadVerificationFile(s.utilityBillBackUri, `${userId}/current/utility-bill-back.jpg`),
      profileModel.uploadVerificationFile(s.idFrontUri, `${userId}/current/id-front.jpg`),
      profileModel.uploadVerificationFile(s.idBackUri, `${userId}/current/id-back.jpg`),
    ]);

    const { error: profileError } = await profileModel.upsertVerificationProfile(userId, s, {
      utilityFrontUrl, utilityBackUrl, idFrontUrl, idBackUrl,
    });
    if (profileError) throw new Error(`Failed to save profile: ${profileError.message}`);

    const { error: metaError } = await profileModel.updateUserMeta({
      name: `${s.firstName} ${s.lastName}`,
    });
    if (metaError) throw new Error(`Failed to update user metadata: ${metaError.message}`);

    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Submission failed. Please try again.' };
  }
};
