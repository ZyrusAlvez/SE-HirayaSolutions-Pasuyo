import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface KebabAction {
  label: string;
  icon: string;
  onPress: () => void;
  disabled?: boolean;
}

interface Props {
  actions: KebabAction[];
}

export default function KebabMenu({ actions }: Props) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef<View>(null);

  const open = () => {
    ref.current?.measureInWindow((x, y, w, h) => {
      setPos({ x: x - 100, y: y + h + 4 });
      setVisible(true);
    });
  };

  return (
    <View ref={ref}>
      <TouchableOpacity style={{ padding: 8, margin: -8 }} activeOpacity={0.6} onPress={open}>
        <Ionicons name="ellipsis-vertical" size={16} color="#9CA3AF" />
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="none" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={{ position: 'absolute', top: pos.y, left: pos.x, backgroundColor: '#fff', borderRadius: 10, minWidth: 120, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 8, borderWidth: 1, borderColor: '#F3F4F6' }}>
            {actions.length > 0 ? actions.map((action, i) => (
              <TouchableOpacity
                key={action.label}
                onPress={() => { if (!action.disabled) { setVisible(false); action.onPress(); } }}
                activeOpacity={action.disabled ? 1 : 0.7}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: i < actions.length - 1 ? 1 : 0, borderBottomColor: '#F3F4F6', opacity: action.disabled ? 0.35 : 1 }}
              >
                <Ionicons name={action.icon as any} size={13} color="#374151" />
                <Text style={{ fontSize: 12, color: '#374151', fontWeight: '500' }}>{action.label}</Text>
              </TouchableOpacity>
            )) : (
              <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
                <Text style={{ fontSize: 11, color: '#9CA3AF' }}>No actions</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
