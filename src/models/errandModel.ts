import { supabase } from '@/utils/supabase';

export type ErrandStatus = 'Available' | 'Expired' | 'In Progress' | 'Completed' | 'Cancelled';

export type Errand = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_remote: boolean;
  status: ErrandStatus;
  accepted_by: string | null;
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
    .eq('status', 'Available')
    .or('deadline.is.null,deadline.gt.' + new Date().toISOString());

export const deleteErrand = (id: string) =>
  supabase.from('errands').delete().eq('id', id);

// export const cancelErrand = (id: string) =>
//   supabase.from('errands').update({ status: 'Cancelled' }).eq('id', id);

export const getErrandRunner = (id: string) =>
  supabase.from('errands').select('runner_id').eq('id', id).single();

export const updateErrand = (id: string, updates: Record<string, any>) =>
  supabase.from('errands').update(updates).eq('id', id);

export const acceptErrand = (id: string, userId: string) =>
  supabase.from('errands').update({ accepted_by: userId, status: 'In Progress' }).eq('id', id);

export const cancelErrand = (id: string) =>
  supabase.from('errands').update({ accepted_by: null, status: 'Available' }).eq('id', id);

export const markErrandDone = (id: string) =>
  supabase.from('errands').update({ status: 'Completed' }).eq('id', id);

export const insertErrandReview = (errandId: string, reviewerId: string, reviewedId: string, rating: number, feedback: string | null) =>
  supabase.from('errand_reviews').insert({ errand_id: errandId, reviewer_id: reviewerId, reviewed_id: reviewedId, rating, feedback });

export const getErrandReview = (errandId: string, reviewerId: string) =>
  supabase.from('errand_reviews').select('rating, feedback').eq('errand_id', errandId).eq('reviewer_id', reviewerId).maybeSingle();

export const insertErrandCancellation = (errandId: string, cancelledBy: string, reason: string, details: string | null) =>
  supabase.from('errand_cancellations').insert({ errand_id: errandId, cancelled_by: cancelledBy, reason, details });

export const getPostedErrands = (userId: string) =>
  supabase
    .from('errands_with_profiles')
    .select('id, user_id, title, description, status, budget, deadline, is_remote, location_lat, location_lng, accepted_by, poster_name, poster_avatar, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

export const getAcceptedErrands = (userId: string) =>
  supabase
    .from('errands_with_profiles')
    .select('id, user_id, title, description, status, budget, deadline, is_remote, location_lat, location_lng, accepted_by, poster_name, poster_avatar, created_at')
    .eq('accepted_by', userId)
    .order('created_at', { ascending: false });

export const getCancelledErrandIds = async (userId: string): Promise<Set<string>> => {
  const { data } = await supabase
    .from('errand_cancellations')
    .select('errand_id')
    .eq('cancelled_by', userId);
  return new Set((data ?? []).map(r => r.errand_id));
};

export const getCancelledErrands = (errandIds: string[]) =>
  supabase
    .from('errands_with_profiles')
    .select('id, user_id, title, description, status, budget, deadline, is_remote, location_lat, location_lng, accepted_by, poster_name, poster_avatar, created_at')
    .in('id', errandIds)
    .order('created_at', { ascending: false });
