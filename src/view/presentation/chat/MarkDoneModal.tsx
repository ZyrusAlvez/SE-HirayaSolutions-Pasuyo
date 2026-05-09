import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  errandTitle?: string;
  description?: string;
  budget?: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function MarkDoneModal({ visible, errandTitle, description, budget, onClose, onConfirm }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    await onConfirm();
    setSubmitting(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 420 }}>
          <ScrollView bounces={false} contentContainerStyle={{ padding: 24 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Mark as Done</Text>
              </View>
            </View>

            {/* Errand summary */}
            <View style={{ backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', flex: 1 }} numberOfLines={1}>{errandTitle}</Text>
                {budget != null && (
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#FEA405', marginLeft: 8 }}>₱{budget.toLocaleString()}</Text>
                )}
              </View>
              {description ? (
                <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 17, marginTop: 4 }} numberOfLines={2}>{description}</Text>
              ) : null}
            </View>

            <View style={{ flexDirection: 'row', paddingHorizontal: 4, marginBottom: 20, gap: 6, alignItems: 'center' }}>
              <Ionicons name="warning-outline" size={14} color="#D97706" />
              <Text style={{ fontSize: 11, color: '#92400E', flex: 1, lineHeight: 17 }}>
                By marking this errand as done, you confirm that the task is fully completed and you have received your payment. This action cannot be undone.
              </Text>
            </View>

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity testID="mark-done-back-btn" onPress={onClose} activeOpacity={0.8} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280' }}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="mark-done-confirm-btn"
                onPress={handleConfirm}
                disabled={submitting}
                activeOpacity={0.8}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#FEA405', alignItems: 'center', opacity: submitting ? 0.6 : 1 }}
              >
                {submitting
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Confirm Done</Text>
                }
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
