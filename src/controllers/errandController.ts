import * as errandModel from '@/models/errandModel';
import type { Errand, ErrandStatus, PinnedLocation, PostErrandParams } from '@/models/errandModel';
import * as ImagePicker from 'expo-image-picker';

export type { Errand, ErrandStatus, PinnedLocation, PostErrandParams };

export const ACCEPTED_EXTENSIONS = ['JPG', 'JPEG', 'PNG', 'WebP'];
export const MAX_FILE_SIZE_MB = 5;

type Result<T> = { success: true; data: T } | { success: false; error: string };

const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const inferMime = (asset: { mimeType?: string | null; fileName?: string | null; uri?: string | null }) => {
  if (asset.mimeType) return asset.mimeType;
  const ext = (asset.fileName ?? asset.uri ?? '').split('.').pop()?.toLowerCase() ?? '';
  return ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[ext] ?? '');
};

export const selectErrandImages = async (
  remaining: number,
): Promise<{ uris: string[]; errors: string[] }> => {
  let result;
  try {
    result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.8 });
  } catch {
    return { uris: [], errors: ['Some files could not be read. Use JPG, PNG, or WebP.'] };
  }
  if (result.canceled) return { uris: [], errors: [] };

  const errors: string[] = [];
  const uris: string[] = [];
  for (const asset of result.assets.slice(0, remaining)) {
    const mime = inferMime(asset);
    if (!ACCEPTED_MIME_TYPES.includes(mime))
      errors.push(`"${asset.fileName ?? 'File'}" is not a supported type. Use JPG, PNG, or WebP.`);
    else if (asset.fileSize && asset.fileSize > MAX_BYTES)
      errors.push(`"${asset.fileName ?? 'File'}" exceeds the ${MAX_FILE_SIZE_MB}MB size limit.`);
    else
      uris.push(asset.uri);
  }
  if (result.assets.length > remaining)
    errors.push(`Only ${remaining} more image${remaining === 1 ? '' : 's'} allowed. Extra selections were ignored.`);
  return { uris, errors };
};

export const getErrand = async (id: string): Promise<Result<Errand>> => {
  const { data, error } = await errandModel.getErrandById(id);
  if (error || !data) return { success: false, error: 'Errand not found' };

  if (data.status === 'Available' && data.deadline && new Date(data.deadline) < new Date()) {
    data.status = 'Expired';
  }

  return { success: true, data: data as Errand };
};

export const getErrands = async (): Promise<Result<Errand[]>> => {
  const { data, error } = await errandModel.getAvailableErrands();
  if (error) return { success: false, error: 'Failed to fetch errands' };
  return { success: true, data: (data ?? []) as Errand[] };
};

export type ErrandEditParams = {
  title: string;
  description: string;
  isRemote: boolean;
  budget: string;
  deadline: Date | null;
  images: string[];
  addressDetails: string;
  pinnedLocation: { lat: number; lng: number; name: string } | null;
};

export type ErrandUpdates = {
  title: string;
  description: string;
  is_remote: boolean;
  budget: number | null;
  deadline: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_name: string | null;
  address_details: string | null;
  images: string[];
};

export const editErrand = async (
  errandId: string,
  params: ErrandEditParams,
  status: string,
): Promise<{ success: boolean; error: string; data?: ErrandUpdates }> => {
  const { title, description, isRemote, budget, deadline, images, addressDetails, pinnedLocation } = params;
  if (status === 'In Progress') return { success: false, error: 'This errand has already been accepted and cannot be edited.' };
  if (!title.trim()) return { success: false, error: 'Title cannot be empty.' };
  if (!description.trim()) return { success: false, error: 'Description cannot be empty.' };
  if (!isRemote && !pinnedLocation) return { success: false, error: 'Please pin a location for onsite errands.' };

  try {
    const { data: { user } } = await errandModel.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const existingUrls = images.filter(uri => uri.startsWith('http'));
    const newUris = images.filter(uri => !uri.startsWith('http'));
    const uploadedUrls = newUris.length > 0 ? await errandModel.postImages(user.id, errandId, newUris) : [];
    const imageUrls = [...existingUrls, ...uploadedUrls];

    const updates = {
      title: title.trim(),
      description: description.trim(),
      is_remote: isRemote,
      budget: budget ? parseFloat(budget) : null,
      deadline: deadline ? deadline.toISOString() : null,
      location_lat: pinnedLocation?.lat ?? null,
      location_lng: pinnedLocation?.lng ?? null,
      location_name: pinnedLocation?.name ?? null,
      address_details: addressDetails.trim() || null,
      images: imageUrls,
    };

    const { error } = await errandModel.updateErrand(errandId, updates);
    if (error) throw error;

    return { success: true, error: '', data: updates };
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Something went wrong' };
  }
};

export const deleteErrand = async (id: string, status: string): Promise<{ success: boolean; error: string }> => {
  if (status === 'In Progress') return { success: false, error: 'This errand has already been accepted and cannot be deleted.' };
  try {
    const { error } = await errandModel.deleteErrand(id);
    if (error) return { success: false, error: 'Failed to delete errand' };
    return { success: true, error: '' };
  } catch {
    return { success: false, error: 'Failed to delete errand' };
  }
};

export const postErrand = async (
  params: PostErrandParams,
): Promise<{ success: true } | { success: false; error: string }> => {
  const { title, description, isRemote, pinnedLocation, addressDetails, budget, deadline, images } = params;

  if (!title.trim()) return { success: false, error: 'Please enter a title.' };
  if (!description.trim()) return { success: false, error: 'Please enter a description.' };
  if (!isRemote && !pinnedLocation) return { success: false, error: 'Please pin a location for onsite errands.' };

  try {
    const { data: { user } } = await errandModel.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: inserted, error: insertError } = await errandModel.postErrand({ ...params, userId: user.id });
    if (insertError) throw insertError;

    if (images.length > 0) {
      const imageUrls = await errandModel.postImages(user.id, inserted.id, images);
      await errandModel.updateErrandImages(inserted.id, imageUrls);
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Something went wrong' };
  }
};
