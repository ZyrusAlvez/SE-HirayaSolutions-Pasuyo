import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Pressable, ScrollView, ActivityIndicator, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { submitReport, checkExistingReport, MAX_REPORT_FILES, MAX_REPORT_FILE_SIZE, USER_REASONS, ERRAND_REASONS } from '@/controllers/reportController';
import type { ReportType, ReportFile } from '@/controllers/reportController';
import { toast } from '@/utils/toast';

interface Props {
  visible: boolean;
  userName?: string;
  reportedId?: string;
  errandId?: string;
  type?: ReportType;
  onClose: () => void;
}

export default function ReportModal({ visible, userName, reportedId, errandId, type = 'user', onClose }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [files, setFiles] = useState<ReportFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!visible || !reportedId) return;
    setChecking(true);
    setAlreadyReported(false);
    checkExistingReport(reportedId, type, errandId).then((res) => {
      if ('exists' in res) setAlreadyReported(res.exists);
      setChecking(false);
    });
  }, [visible, reportedId, type, errandId]);

  const isErrand = type === 'errand';
  const reasons = isErrand ? ERRAND_REASONS : USER_REASONS;
  const title = isErrand ? 'Report Errand' : `Report ${userName ?? 'User'}`;
  const prompt = isErrand ? 'Why are you reporting this errand?' : 'Why are you reporting this user?';

  const reset = () => { setSelected(null); setDetails(''); setFiles([]); setFileError(null); };
  const handleClose = () => { if (!submitting) { reset(); onClose(); } };

  const pickFiles = async () => {
    if (files.length >= MAX_REPORT_FILES) {
      setFileError(`Maximum ${MAX_REPORT_FILES} files allowed`);
      return;
    }
    setFileError(null);
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
      return;
    }
    try {
      const DocumentPicker = await import('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      if (asset.size && asset.size > MAX_REPORT_FILE_SIZE) {
        setFileError(`"${asset.name}" exceeds 5 MB`);
        return;
      }
      setFileError(null);
      setFiles(prev => [
        ...prev,
        { uri: asset.uri, name: asset.name, mimeType: asset.mimeType || 'application/octet-stream', size: asset.size },
      ]);
    } catch {}
  };

  const handleWebFile = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_REPORT_FILE_SIZE) {
      setFileError(`"${file.name}" exceeds 5 MB`);
      e.target.value = '';
      return;
    }
    setFileError(null);
    const uri = URL.createObjectURL(file);
    setFiles(prev => [...prev, { uri, name: file.name, mimeType: file.type || 'application/octet-stream', size: file.size }]);
    e.target.value = '';
  };

  const removeFile = (index: number) => { setFiles(prev => prev.filter((_, i) => i !== index)); setFileError(null); };

  const handleSubmit = async () => {
    if (!selected || !reportedId) return;
    setSubmitting(true);
    const result = await submitReport(reportedId, type, selected, details, files, errandId);
    setSubmitting(false);
    if (result.success) {
      toast({ title: 'Report submitted', preset: 'done' });
      reset();
      onClose();
    } else {
      toast({ title: result.error, preset: 'error' });
    }
  };

  const isImage = (mime: string) => mime.startsWith('image/');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable onPress={handleClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 420, maxHeight: '85%' }}>
          <ScrollView bounces={false} contentContainerStyle={{ padding: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="flag" size={18} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{title}</Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>Help us keep the platform safe</Text>
              </View>
            </View>

            {checking ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <ActivityIndicator size="large" color="#FEA405" />
              </View>
            ) : alreadyReported ? (
              <View style={{ alignItems: 'center', paddingVertical: 16, gap: 12 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="time-outline" size={24} color="#D97706" />
                </View>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', textAlign: 'center' }}>Report already submitted</Text>
                <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 20 }}>
                  Your report is currently being reviewed by our team. We'll take action as soon as possible.
                </Text>
                <TouchableOpacity onPress={handleClose} activeOpacity={0.8} style={{ marginTop: 8, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 10, backgroundColor: '#F3F4F6' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>Got it</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
            <Text style={{ fontSize: 13, color: '#374151', marginBottom: 12 }}>{prompt}</Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {reasons.map((reason) => {
                const active = selected === reason;
                return (
                  <TouchableOpacity
                    key={reason}
                    onPress={() => setSelected(active ? null : reason)}
                    activeOpacity={0.7}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                      borderWidth: 1,
                      borderColor: active ? '#EF4444' : '#E5E7EB',
                      backgroundColor: active ? '#FEF2F2' : '#F9FAFB',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: active ? '600' : '400', color: active ? '#DC2626' : '#374151' }}>{reason}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>Additional details (optional):</Text>
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="Tell us more about what happened..."
              placeholderTextColor="#9CA3AF"
              multiline
              style={{
                borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10,
                padding: 12, fontSize: 13, color: '#111827',
                minHeight: 72, textAlignVertical: 'top',
              }}
            />

            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 16, marginBottom: 6 }}>
              Attachments - optional ({files.length}/{MAX_REPORT_FILES}, 5 MB each):
            </Text>
            {fileError && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                <Text style={{ fontSize: 12, color: '#EF4444' }}>{fileError}</Text>
              </View>
            )}
            {files.length > 0 && (
              <View style={{ gap: 8, marginBottom: 8 }}>
                {files.map((f, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', padding: 8, gap: 8 }}>
                    {isImage(f.mimeType) ? (
                      <Image source={{ uri: f.uri }} style={{ width: 36, height: 36, borderRadius: 6 }} />
                    ) : (
                      <View style={{ width: 36, height: 36, borderRadius: 6, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="document-outline" size={18} color="#6B7280" />
                      </View>
                    )}
                    <Text numberOfLines={1} style={{ flex: 1, fontSize: 12, color: '#374151' }}>{f.name}</Text>
                    <TouchableOpacity onPress={() => removeFile(i)} disabled={submitting}>
                      <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            {files.length < MAX_REPORT_FILES && (
              <>
                {Platform.OS === 'web' && (
                  <input
                    ref={fileInputRef as any}
                    type="file"
                    onChange={handleWebFile}
                    style={{ display: 'none' }}
                  />
                )}
                <Pressable
                  onPress={pickFiles}
                  disabled={submitting}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                    paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#D1D5DB',
                  }}
                >
                  <Ionicons name="cloud-upload-outline" size={16} color="#6B7280" />
                  <Text style={{ fontSize: 13, color: '#6B7280' }}>Add files</Text>
                </Pressable>
              </>
            )}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity onPress={handleClose} activeOpacity={0.8} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!selected || submitting}
                activeOpacity={0.8}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: !selected ? '#FCA5A5' : '#EF4444', alignItems: 'center' }}
              >
                {submitting
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Submit Report</Text>
                }
              </TouchableOpacity>
            </View>
              </>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
