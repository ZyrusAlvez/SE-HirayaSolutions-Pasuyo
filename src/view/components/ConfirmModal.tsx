import { View, Text, TouchableOpacity, Modal } from 'react-native';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  testID?: string;
  confirmTestID?: string;
  cancelTestID?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ visible, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive, testID, confirmTestID, cancelTestID, onConfirm, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableOpacity style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)' }} activeOpacity={1} onPress={onCancel}>
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} testID={testID} style={{ backgroundColor: '#fff', borderRadius: 16, width: 300, padding: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 }}>{title}</Text>
          <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 19, marginBottom: 20 }}>{message}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity testID={cancelTestID} onPress={onCancel} activeOpacity={0.7} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280' }}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity testID={confirmTestID} onPress={onConfirm} activeOpacity={0.7} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: destructive ? '#EF4444' : '#FEA405', alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
