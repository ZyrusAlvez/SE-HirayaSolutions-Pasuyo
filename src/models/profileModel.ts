import { supabase } from '@/utils/supabase';

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


export const getUserVerification = (userId: string) =>
  supabase.from('profiles').select('verified').eq('id', userId).single();
