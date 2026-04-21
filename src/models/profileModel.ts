import { supabase, supabaseAdmin } from '@/utils/supabase';
import { Platform } from 'react-native';

const VERIFICATION_BUCKET = 'verifications';
const ONE_YEAR = 365 * 24 * 60 * 60;
const CURRENT_FILES = [
  'utility-bill-front.jpg',
  'utility-bill-back.jpg',
  'id-front.jpg',
  'id-back.jpg',
];

export type VerificationStatus = 'verified' | 'pending' | 'not_verified';

// this is the data type being shown in the profile page
export type ProfileData = {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  verificationStatus: VerificationStatus;
  gender?: string;
  date_of_birth?: string;
  address_province?: string;
  address_city?: string;
  address_barangay?: string;
};

export type LocationOption = { code: string; name: string };

export interface VerifyFormState {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  gender: 'Male' | 'Female' | 'Prefer not' | '';
  dateOfBirth: Date | null;
  addressType: 'House' | 'Apartment' | 'Building';
  province: LocationOption | null;
  city: LocationOption | null;
  barangay: LocationOption | null;
  houseNo: string;
  street: string;
  buildingName: string;
  unitNo: string;
  floor: string;
  blockLot: string;
  phase: string;
  utilityBillType: 'Water' | 'Electricity' | 'Internet' | '';
  utilityBillFrontUri: string | null;
  utilityBillBackUri: string | null;
  idType: string;
  idFrontUri: string | null;
  idBackUri: string | null;
}

export async function deleteCurrentFiles(userId: string) {
  const timestamp = new Date().toISOString();
  for (const file of CURRENT_FILES) {
    const from = `${userId}/current/${file}`;
    const to = `${userId}/history/${timestamp}/${file}`;
    const { error: copyError } = await supabase.storage.from(VERIFICATION_BUCKET).copy(from, to);
    if (!copyError) {
      await supabase.storage.from(VERIFICATION_BUCKET).remove([from]);
    }
  }
}

export async function postVerificationFile(uri: string, path: string): Promise<string> {
  let blob: Blob;

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    blob = await response.blob();
  } else {
    const { readAsStringAsync } = await import('expo-file-system/legacy');
    const base64 = await readAsStringAsync(uri, { encoding: 'base64' });
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    blob = new Blob([bytes], { type: 'image/jpeg' });
  }

  const { error } = await supabase.storage.from(VERIFICATION_BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw new Error(`Upload failed for ${path}: ${error.message}`);

  const { data, error: urlError } = await supabase.storage
    .from(VERIFICATION_BUCKET)
    .createSignedUrl(path, ONE_YEAR);
  if (urlError || !data) throw new Error(`Failed to get URL for ${path}: ${urlError?.message}`);

  return data.signedUrl;
}

export const getUser = () => supabase.auth.getUser();

export type DisplayProfile = {
  name: string;
  avatarUrl: string | null;
  verified: boolean;
  verificationStatus: VerificationStatus;
};

export const getDisplayProfile = async (userId: string): Promise<DisplayProfile> => {
  const client = supabaseAdmin ?? supabase;
  const { data: profile } = await client
    .from('profiles')
    .select('verified, pending_verification, first_name, last_name, avatar_url')
    .eq('id', userId)
    .single();

  const profileName = profile?.first_name || profile?.last_name
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ')
    : null;

  const verificationStatus: VerificationStatus = profile?.verified
    ? 'verified'
    : profile?.pending_verification
      ? 'pending'
      : 'not_verified';

  if (profileName) {
    return {
      name: profileName,
      avatarUrl: profile?.avatar_url ?? null,
      verified: profile?.verified ?? false,
      verificationStatus,
    };
  }

  if (supabaseAdmin) {
    const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
    const meta = data?.user?.user_metadata;
    const rawUrl = meta?.custom_avatar_url || meta?.avatar_url;
    return {
      name: meta?.name || meta?.full_name || 'Unknown',
      avatarUrl: rawUrl && rawUrl !== 'default' ? rawUrl : null,
      verified: false,
      verificationStatus,
    };
  }

  return { name: 'Unknown', avatarUrl: null, verified: false, verificationStatus: 'not_verified' };
};

export const getProfile = (userId: string) =>
  supabase
    .from('profiles')
    .select('verified, pending_verification, gender, date_of_birth, address_province, address_city, address_barangay, first_name, last_name, avatar_url, last_seen')
    .eq('id', userId)
    .single();

export const getHeaderProfile = (userId: string) =>
  supabase
    .from('profiles')
    .select('avatar_url, verified, pending_verification')
    .eq('id', userId)
    .single();

export const postUserMeta = (data: Record<string, string>) =>
  supabase.auth.updateUser({ data });

export const postProfileAvatar = (userId: string, avatarUrl: string) =>
  supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId);

export const postAvatar = async (uri: string, name: string, email: string): Promise<string> => {
  const safeName = name.trim().replace(/\s+/g, '_');
  const safeEmail = email.replace(/[@.]/g, '_');
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


export const postVerificationProfile = (userId: string, s: VerifyFormState, urls: {
  utilityFrontUrl: string;
  utilityBackUrl: string;
  idFrontUrl: string;
  idBackUrl: string;
}) =>
  supabase.from('profiles').upsert({
    id: userId,
    first_name: s.firstName,
    middle_name: s.middleName,
    last_name: s.lastName,
    suffix: s.suffix,
    gender: s.gender,
    date_of_birth: s.dateOfBirth!.toISOString().split('T')[0],
    address_type: s.addressType,
    address_province: s.province!.name,
    address_city: s.city!.name,
    address_barangay: s.barangay!.name,
    address_street: s.street,
    address_house_no: s.houseNo,
    address_building: s.buildingName,
    address_unit: s.unitNo,
    address_floor: s.floor,
    address_block_lot: s.blockLot,
    address_phase_subdivision: s.phase,
    utility_bill_type: s.utilityBillType.toLowerCase(),
    utility_bill_front_url: urls.utilityFrontUrl,
    utility_bill_back_url: urls.utilityBackUrl,
    id_type: s.idType,
    id_front_url: urls.idFrontUrl,
    id_back_url: urls.idBackUrl,
    pending_verification: true,
    verified: false,
    verification_submitted_at: new Date().toISOString(),
  });
