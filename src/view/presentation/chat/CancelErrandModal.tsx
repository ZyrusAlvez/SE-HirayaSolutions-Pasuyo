import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ── Edit these to change the quick-select reasons ──
const CANCEL_REASONS = [
  'Change of mind',
  'Misclick',
  'Schedule conflict',
  'Unable to complete',
  'Emergency',
  'Found a better option',
];

interface Props {
  visible: boolean;
  errandTitle?: string;
  onClose: () => void;
  onConfirm: (reason: string, details: string | null) => Promise<void>;
}

export default function CancelErrandModal({ visible, errandTitle, onClose, onConfirm }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => { setSelected(null); setDetails(''); };

  const handleConfirm = async () => {
    if (!selected) return;
    setSubmitting(true);
    await onConfirm(selected, details.trim() || null);
    setSubmitting(false);
    reset();
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable onPress={handleClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 420, maxHeight: '85%' }}>
          <ScrollView bounces={false} contentContainerStyle={{ padding: 24 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Cancel Errand</Text>
                {errandTitle && <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }} numberOfLines={1}>{errandTitle}</Text>}
              </View>
            </View>

            <Text style={{ fontSize: 13, color: '#374151', marginBottom: 12 }}>Tell us what happened:</Text>

            {/* Reason chips */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {CANCEL_REASONS.map((reason) => {
                const active = selected === reason;
                return (
                  <TouchableOpacity
                    key={reason}
                    testID={`cancel-reason-${reason.toLowerCase().replace(/ /g, '-')}`}
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

            {/* Details input */}
            <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>Additional details (optional):</Text>
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="Anything else you'd like to share..."
              placeholderTextColor="#9CA3AF"
              multiline
              style={{
                borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10,
                padding: 12, fontSize: 13, color: '#111827',
                minHeight: 72, textAlignVertical: 'top',
              }}
            />

            {/* Warning */}
            <View style={{ flexDirection: 'row', backgroundColor: '#FEF3C7', borderRadius: 10, padding: 12, marginTop: 16, gap: 8 }}>
              <Ionicons name="warning-outline" size={16} color="#D97706" style={{ marginTop: 1 }} />
              <Text style={{ fontSize: 11, color: '#92400E', flex: 1, lineHeight: 17 }}>
                Frequent cancellation of accepted errands may result in suspension or a ban from the platform.
              </Text>
            </View>

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity onPress={handleClose} activeOpacity={0.8} testID="cancel-modal-back-btn" style={{ flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280' }}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirm}
                disabled={!selected || submitting}
                activeOpacity={0.8}
                testID="cancel-modal-confirm-btn"
                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: !selected ? '#FCA5A5' : '#EF4444', alignItems: 'center' }}
              >
                {submitting
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Confirm Cancel</Text>
                }
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
