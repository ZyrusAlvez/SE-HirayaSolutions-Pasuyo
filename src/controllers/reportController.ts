import * as reportModel from '@/models/reportModel';

type Result = { success: true } | { success: false; error: string };
type CheckResult = { exists: boolean } | { success: false; error: string };

export type ReportType = 'user' | 'errand';

export type ReportFile = { uri: string; name: string; mimeType: string; size?: number };

export const MAX_REPORT_FILES = 5;
export const MAX_REPORT_FILE_SIZE = 5 * 1024 * 1024;

export const checkExistingReport = async (
  reportedId: string,
  type: ReportType,
  errandId?: string,
): Promise<CheckResult> => {
  const reporterId = await reportModel.getCurrentUserId();
  if (!reporterId) return { success: false, error: 'Not logged in' };
  const { data } = await reportModel.getExistingReport(reporterId, reportedId, type, errandId);
  return { exists: !!data };
};

export const submitReport = async (
  reportedId: string,
  type: ReportType,
  reason: string,
  details: string | null,
  files: ReportFile[] = [],
  errandId?: string,
): Promise<Result> => {
  if (!reason.trim()) return { success: false, error: 'Please select a reason' };
  if (files.length > MAX_REPORT_FILES) return { success: false, error: `You can attach up to ${MAX_REPORT_FILES} files` };
  const oversized = files.find(f => f.size && f.size > MAX_REPORT_FILE_SIZE);
  if (oversized) return { success: false, error: `"${oversized.name}" exceeds the 5 MB limit` };

  const reporterId = await reportModel.getCurrentUserId();
  if (!reporterId) return { success: false, error: 'You must be logged in to submit a report' };
  if (type === 'user' && reporterId === reportedId) return { success: false, error: 'You cannot report yourself' };

  const { data: existing } = await reportModel.getExistingReport(reporterId, reportedId, type, errandId);
  if (existing) return { success: false, error: 'You have already submitted a report. It is currently being reviewed.' };

  const fileUrls: string[] = [];
  for (const f of files) {
    const url = await reportModel.uploadReportFile(reporterId, f.uri, f.name, f.mimeType);
    if (!url) return { success: false, error: `Failed to upload "${f.name}"` };
    fileUrls.push(url);
  }

  const { error } = await reportModel.insertReport(reporterId, reportedId, type, reason, details?.trim() || null, fileUrls, errandId);
  if (error) return { success: false, error: 'Failed to submit report. Please try again.' };

  return { success: true };
};
