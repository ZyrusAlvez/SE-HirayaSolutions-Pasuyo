import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  title: string;
  description: string;
  reasons: string[];
  confirmLabel: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export default function ReasonModal({ visible, title, description, reasons, confirmLabel, onClose, onConfirm }: Props) {
  const [selected, setSelected] = useState(reasons[0]);
  const [custom, setCustom] = useState('');

  const handleConfirm = () => {
    const reason = selected === 'Other' ? custom.trim() : selected;
    if (!reason) return;
    onConfirm(reason);
    setSelected(reasons[0]);
    setCustom('');
  };

  const disabled = selected === 'Other' && !custom.trim();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)', padding: 24 }} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 360, maxHeight: '80%' }}>
          <View style={{ padding: 24, paddingBottom: 0 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 }}>{title}</Text>
            <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 19, marginBottom: 16 }}>{description}</Text>
          </View>

          <ScrollView style={{ paddingHorizontal: 24 }} contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={true}>
            {reasons.map((reason) => (
              <TouchableOpacity
                key={reason}
                activeOpacity={0.7}
                onPress={() => setSelected(reason)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: selected === reason ? '#FEF2F2' : 'transparent', borderWidth: 1, borderColor: selected === reason ? '#FECACA' : '#F3F4F6', marginBottom: 6 }}
              >
                <Ionicons
                  name={selected === reason ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={selected === reason ? '#EF4444' : '#D1D5DB'}
                />
                <Text style={{ fontSize: 13, color: selected === reason ? '#991B1B' : '#374151', fontWeight: selected === reason ? '600' : '400', flex: 1 }}>{reason}</Text>
              </TouchableOpacity>
            ))}
            {selected === 'Other' && (
              <TextInput
                placeholder="Enter custom reason..."
                placeholderTextColor="#9CA3AF"
                value={custom}
                onChangeText={setCustom}
                multiline
                style={{ borderWidth: 1, borderColor: '#FECACA', borderRadius: 10, padding: 12, fontSize: 13, color: '#1F2937', minHeight: 60, marginTop: 4, backgroundColor: '#FEF2F2' } as any}
              />
            )}
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 10, padding: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} activeOpacity={0.7} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: disabled ? '#FCA5A5' : '#EF4444', alignItems: 'center' }} disabled={disabled}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
