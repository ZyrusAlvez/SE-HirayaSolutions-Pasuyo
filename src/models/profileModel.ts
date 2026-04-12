import { supabase } from '@/utils/supabase';

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

export const getUser = () => supabase.auth.getUser();

export const getProfile = (userId: string) =>
  supabase
    .from('profiles')
    .select('verified, pending_verification, gender, date_of_birth, address_province, address_city, address_barangay, first_name, last_name')
    .eq('id', userId)
    .single();

export const updateUserMeta = (data: Record<string, string>) =>
  supabase.auth.updateUser({ data });

export const updateProfileAvatar = (userId: string, avatarUrl: string) =>
  supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId);

export const uploadAvatar = async (uri: string, name: string, email: string): Promise<string> => {
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


export const upsertVerificationProfile = (userId: string, s: VerifyFormState, urls: {
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
