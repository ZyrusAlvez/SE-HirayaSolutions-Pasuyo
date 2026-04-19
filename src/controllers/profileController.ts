import * as profileModel from '@/models/profileModel';
import type { VerificationStatus, ProfileData, VerifyFormState } from '@/models/profileModel';
import { getDisplayProfile } from '@/models/profileModel';
import * as ImagePicker from 'expo-image-picker';

export type { VerificationStatus, ProfileData, VerifyFormState };

type Result<T = void> = { success: true; data: T } | { success: false; error: string };

export const getProfile = async (): Promise<Result<ProfileData | null>> => {
  const { data: { user } } = await profileModel.getUser();
  if (!user) return { success: true, data: null };

  const display = await getDisplayProfile(user.id);
  const { data: profile } = await profileModel.getProfile(user.id);

  let profileInfo: Partial<ProfileData> = {};
  if (profile?.verified) {
    profileInfo = {
      gender: profile.gender,
      date_of_birth: profile.date_of_birth,
      address_province: profile.address_province,
      address_city: profile.address_city,
      address_barangay: profile.address_barangay,
    };
  }

  return {
    success: true,
    data: {
      id: user.id,
      displayName: display.name,
      email: user.email || '',
      avatarUrl: display.avatarUrl,
      verificationStatus: display.verificationStatus,
      ...profileInfo,
    },
  };
};

export const getAvatarImage = async (): Promise<Result<string>> => {
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
    return { success: false, error: 'Only JPG, PNG, or WEBP images are allowed lol' };
  }

  if (result.canceled) return { success: false, error: '' };

  const asset = result.assets[0];
  const src = asset.fileName ?? asset.uri ?? '';
  const ext = src.split('.').pop()?.toLowerCase() ?? '';
  const mime = asset.mimeType ?? ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[ext] ?? '');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime))
    return { success: false, error: 'Only JPG, PNG, or WebP images are allowed' };
  if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024)
    return { success: false, error: 'Image must be under 5MB' };

  return { success: true, data: asset.uri };
};

export const getVerificationImage = async (): Promise<Result<string>> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return { success: false, error: 'Permission required to access photos' };
  let result;
  try {
    result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
  } catch {
    return { success: false, error: 'Only JPG, PNG, or WebP images are allowed' };
  }
  if (result.canceled) return { success: false, error: '' };
  const asset = result.assets[0];
  const src = asset.fileName ?? asset.uri ?? '';
  const ext = src.split('.').pop()?.toLowerCase() ?? '';
  const mime = asset.mimeType ?? ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[ext] ?? '');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime))
    return { success: false, error: `"${asset.fileName ?? 'File'}" is not a supported type. Use JPG, PNG, or WebP.` };
  if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024)
    return { success: false, error: `"${asset.fileName ?? 'File'}" exceeds the 5MB size limit.` };
  return { success: true, data: asset.uri };
};

export const updateProfile = async (
  displayName: string,
  pendingImageUri: string | null,
): Promise<Result<{ finalAvatarUrl: string | null }>> => {
  if (!displayName.trim()) return { success: false, error: 'Display name is required' };

  const { data: { user } } = await profileModel.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const updates: Record<string, string> = { name: displayName };
  let finalAvatarUrl: string | null = null;

  if (pendingImageUri) {
    finalAvatarUrl = await profileModel.postAvatar(pendingImageUri, displayName, user.email || '');
    updates.custom_avatar_url = finalAvatarUrl;
    await profileModel.postProfileAvatar(user.id, finalAvatarUrl);
  }

  const { error } = await profileModel.postUserMeta(updates);
  if (error) return { success: false, error: 'Failed to update profile' };

  return { success: true, data: { finalAvatarUrl } };
};

export const getVerifyStepError = (step: number, s: VerifyFormState): string | null => {
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

export const postVerification = async (s: VerifyFormState): Promise<Result<void>> => {
  try {
    const { data: { user } } = await profileModel.getUser();
    if (!user) throw new Error('Not authenticated');

    if (!s.dateOfBirth || !s.province || !s.city || !s.barangay)
      throw new Error('Missing required fields');
    if (!s.utilityBillFrontUri || !s.utilityBillBackUri || !s.idFrontUri || !s.idBackUri)
      throw new Error('Missing required file uploads');

    const userId = user.id;
    await profileModel.deleteCurrentFiles(userId);

    const [utilityFrontUrl, utilityBackUrl, idFrontUrl, idBackUrl] = await Promise.all([
      profileModel.postVerificationFile(s.utilityBillFrontUri, `${userId}/current/utility-bill-front.jpg`),
      profileModel.postVerificationFile(s.utilityBillBackUri, `${userId}/current/utility-bill-back.jpg`),
      profileModel.postVerificationFile(s.idFrontUri, `${userId}/current/id-front.jpg`),
      profileModel.postVerificationFile(s.idBackUri, `${userId}/current/id-back.jpg`),
    ]);

    const { error: profileError } = await profileModel.postVerificationProfile(userId, s, {
      utilityFrontUrl, utilityBackUrl, idFrontUrl, idBackUrl,
    });
    if (profileError) throw new Error(`Failed to save profile: ${profileError.message}`);

    const { error: metaError } = await profileModel.postUserMeta({
      name: `${s.firstName} ${s.lastName}`,
    });
    if (metaError) throw new Error(`Failed to update user metadata: ${metaError.message}`);

    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Submission failed. Please try again.' };
  }
};
