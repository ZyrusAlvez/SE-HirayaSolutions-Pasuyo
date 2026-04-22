import { supabase } from '@/utils/supabase';

export type ErrandStatus = 'Available' | 'Expired' | 'In Progress' | 'Completed';

export type Errand = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_remote: boolean;
  status: ErrandStatus;
  location_lat: number | null;
  location_lng: number | null;
  location_name?: string;
  address_details?: string;
  budget?: number;
  deadline?: string;
  images?: string[];
  created_at: string;
  poster_name?: string;
  poster_avatar?: string;
  poster_rating?: number;
  poster_is_verified?: boolean;
};

export type PinnedLocation = { lat: number; lng: number; name: string };

export interface PostErrandParams {
  title: string;
  description: string;
  isRemote: boolean;
  pinnedLocation: PinnedLocation | null;
  addressDetails: string;
  budget: string;
  deadline: Date | null;
  images: string[];
}

export const postImages = async (userId: string, errandId: string, images: string[]): Promise<string[]> => {
  const urls: string[] = [];
  for (const uri of images) {
    const response = await fetch(uri);
    const blob = await response.blob();
    const ext = blob.type.split('/')[1] ?? 'jpg';
    const fileName = `${userId}/${errandId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('errand-images').upload(fileName, blob, { contentType: blob.type });
    if (!error) {
      const { data } = supabase.storage.from('errand-images').getPublicUrl(fileName);
      urls.push(data.publicUrl);
    }
  }
  return urls;
};

export const getUser = () => supabase.auth.getUser();

export const postErrand = (params: PostErrandParams & { userId: string }) =>
  supabase.from('errands').insert({
    user_id: params.userId,
    title: params.title.trim(),
    description: params.description.trim(),
    is_remote: params.isRemote,
    location_lat: params.pinnedLocation?.lat ?? null,
    location_lng: params.pinnedLocation?.lng ?? null,
    location_name: params.pinnedLocation?.name ?? null,
    address_details: params.addressDetails.trim() || null,
    budget: params.budget ? parseFloat(params.budget) : null,
    deadline: params.deadline ? params.deadline.toISOString() : null,
    images: [],
  }).select('id').single();

export const updateErrandImages = (errandId: string, imageUrls: string[]) =>
  supabase.from('errands').update({ images: imageUrls }).eq('id', errandId);

export const getErrandById = (id: string) =>
  supabase.from('errands_with_profiles').select('*').eq('id', id).single();

export const getAvailableErrands = () =>
  supabase
    .from('errands_with_profiles')
    .select('id, title, description, is_remote, location_lat, location_lng, location_name, budget, deadline, images, poster_name, poster_avatar, poster_is_verified')
    .eq('status', 'Available');

export const getErrandStatus = (id: string) =>
  supabase.from('errands').select('status').eq('id', id).single();

export const deleteErrand = (id: string) =>
  supabase.from('errands').delete().eq('id', id);

export const updateErrand = (id: string, updates: Record<string, any>) =>
  supabase.from('errands').update(updates).eq('id', id);
