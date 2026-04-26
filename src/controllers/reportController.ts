import * as reportModel from '@/models/reportModel';

type Result = { success: true } | { success: false; error: string };

export type ReportType = 'user';

export type ReportFile = { uri: string; name: string; mimeType: string; size?: number };

export const MAX_REPORT_FILES = 5;
export const MAX_REPORT_FILE_SIZE = 5 * 1024 * 1024;

export const submitReport = async (
  reportedId: string,
  type: ReportType,
  reason: string,
  details: string | null,
  files: ReportFile[] = [],
): Promise<Result> => {
  if (!reason.trim()) return { success: false, error: 'Please select a reason' };
  if (files.length > MAX_REPORT_FILES) return { success: false, error: `You can attach up to ${MAX_REPORT_FILES} files` };
  const oversized = files.find(f => f.size && f.size > MAX_REPORT_FILE_SIZE);
  if (oversized) return { success: false, error: `"${oversized.name}" exceeds the 5 MB limit` };

  const reporterId = await reportModel.getCurrentUserId();
  if (!reporterId) return { success: false, error: 'You must be logged in to report a user' };
  if (reporterId === reportedId) return { success: false, error: 'You cannot report yourself' };

  const fileUrls: string[] = [];
  for (const f of files) {
    const url = await reportModel.uploadReportFile(reporterId, f.uri, f.name, f.mimeType);
    if (!url) return { success: false, error: `Failed to upload "${f.name}"` };
    fileUrls.push(url);
  }

  const { error } = await reportModel.insertReport(reporterId, reportedId, type, reason, details?.trim() || null, fileUrls);
  if (error) return { success: false, error: 'Failed to submit report. Please try again.' };

  return { success: true };
};
