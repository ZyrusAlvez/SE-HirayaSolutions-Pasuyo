import { Platform } from 'react-native';
import { supabase } from './supabase';

const BUCKET = 'verifications';
const ONE_YEAR = 365 * 24 * 60 * 60;

const CURRENT_FILES = [
  'utility-bill-front.jpg',
  'utility-bill-back.jpg',
  'id-front.jpg',
  'id-back.jpg',
];

export async function archiveCurrentFiles(userId: string) {
  const timestamp = new Date().toISOString();
  for (const file of CURRENT_FILES) {
    const from = `${userId}/current/${file}`;
    const to = `${userId}/history/${timestamp}/${file}`;
    const { error: copyError } = await supabase.storage.from(BUCKET).copy(from, to);
    if (!copyError) {
      await supabase.storage.from(BUCKET).remove([from]);
    }
    // if copy fails (file doesn't exist), silently continue
  }
}

export async function uploadFile(uri: string, path: string): Promise<string> {
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

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw new Error(`Upload failed for ${path}: ${error.message}`);

  const { data, error: urlError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, ONE_YEAR);
  if (urlError || !data) throw new Error(`Failed to get URL for ${path}: ${urlError?.message}`);

  return data.signedUrl;
}
