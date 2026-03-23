import type { ImagePickerAsset } from 'expo-image-picker';

export const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ACCEPTED_EXTENSIONS = ['JPG', 'JPEG', 'PNG', 'WebP'];
export const MAX_FILE_SIZE_MB = 5;
const MAX_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type ValidationResult = { ok: true } | { ok: false; error: string };

export async function validateImageAsset(
  asset: ImagePickerAsset
): Promise<ValidationResult> {
  const mime = asset.mimeType ?? '';
  if (!ACCEPTED_MIME_TYPES.includes(mime)) {
    return { ok: false, error: `"${asset.fileName ?? 'File'}" is not a supported type. Use JPG, PNG, or WebP.` };
  }
  if (asset.fileSize && asset.fileSize > MAX_BYTES) {
    return { ok: false, error: `"${asset.fileName ?? 'File'}" exceeds the ${MAX_FILE_SIZE_MB}MB size limit.` };
  }
  return { ok: true };
}
