import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Pressable, ScrollView, ActivityIndicator, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { submitReport } from '@/controllers/reportController';
import type { ReportType, ReportFile } from '@/controllers/reportController';
import { toast } from '@/utils/toast';

const REPORT_REASONS = [
  'Scam or fraud',
  'Did not complete the errand',
  'Harassment or abusive behavior',
  'Fake or misleading profile',
  'Inappropriate or offensive content',
  'Other',
];

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface Props {
  visible: boolean;
  userName?: string;
  reportedId?: string;
  type?: ReportType;
  onClose: () => void;
}

export default function ReportModal({ visible, userName, reportedId, type = 'user', onClose }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [files, setFiles] = useState<ReportFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => { setSelected(null); setDetails(''); setFiles([]); };
  const handleClose = () => { if (!submitting) { reset(); onClose(); } };

  const pickFiles = async () => {
    if (files.length >= MAX_FILES) {
      toast({ title: `Maximum ${MAX_FILES} files allowed`, preset: 'error' });
      return;
    }
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
      return;
    }
    try {
      const DocumentPicker = await import('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      if (asset.size && asset.size > MAX_FILE_SIZE) {
        toast({ title: `"${asset.name}" exceeds 5 MB`, preset: 'error' });
        return;
      }
      setFiles(prev => [
        ...prev,
        { uri: asset.uri, name: asset.name, mimeType: asset.mimeType || 'application/octet-stream', size: asset.size },
      ]);
    } catch {}
  };

  const handleWebFile = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: `"${file.name}" exceeds 5 MB`, preset: 'error' });
      e.target.value = '';
      return;
    }
    const uri = URL.createObjectURL(file);
    setFiles(prev => [...prev, { uri, name: file.name, mimeType: file.type || 'application/octet-stream', size: file.size }]);
    e.target.value = '';
  };

  const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!selected || !reportedId) return;
    setSubmitting(true);
    const result = await submitReport(reportedId, type, selected, details, files);
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
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Report {userName ?? 'User'}</Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>Help us keep the platform safe</Text>
              </View>
            </View>

            <Text style={{ fontSize: 13, color: '#374151', marginBottom: 12 }}>Why are you reporting this user?</Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {REPORT_REASONS.map((reason) => {
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
              Attachments - optional ({files.length}/{MAX_FILES}, 5 MB each):
            </Text>
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
            {files.length < MAX_FILES && (
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
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
