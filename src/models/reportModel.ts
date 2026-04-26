import { supabase } from '@/utils/supabase';
import { Platform } from 'react-native';

export const getCurrentUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
};

export const uploadReportFile = async (reporterId: string, uri: string, fileName: string, mimeType: string) => {
  const path = `${reporterId}/${Date.now()}_${fileName}`;

  let body: any;
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    body = await res.blob();
  } else {
    body = { uri, type: mimeType, name: fileName };
  }

  const { error } = await supabase.storage.from('report-files').upload(path, body, { contentType: mimeType, upsert: false });
  if (error) return null;

  const { data } = supabase.storage.from('report-files').getPublicUrl(path);
  return data.publicUrl;
};

export const insertReport = (reporterId: string, reportedId: string, type: string, reason: string, details: string | null, fileUrls: string[]) =>
  supabase.from('reports').insert({
    reporter_id: reporterId,
    reported_id: reportedId,
    type,
    reason,
    details,
    file_urls: fileUrls.length ? fileUrls : null,
  });
