import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const REPORT_REASONS = [
  'Scam or fraud',
  'Did not complete the errand',
  'Harassment or abusive behavior',
  'Fake or misleading profile',
  'Other',
];

interface Props {
  visible: boolean;
  userName?: string;
  onClose: () => void;
}

export default function ReportModal({ visible, userName, onClose }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState('');

  const reset = () => { setSelected(null); setDetails(''); };
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = () => {
    if (!selected) return;
    // TODO: submit report
    reset();
    onClose();
  };

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

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity onPress={handleClose} activeOpacity={0.8} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!selected}
                activeOpacity={0.8}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: !selected ? '#FCA5A5' : '#EF4444', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Submit Report</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
