import * as FileSystem from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';

const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type ValidationResult = { ok: true } | { ok: false; error: string };

export async function validateImageAsset(
  asset: ImagePickerAsset
): Promise<ValidationResult> {
  const mime = asset.mimeType ?? '';
  if (!ACCEPTED_MIME_TYPES.includes(mime)) {
    return { ok: false, error: 'Unsupported file type. Use JPG, PNG, or WebP.' };
  }
  return { ok: true };
}
