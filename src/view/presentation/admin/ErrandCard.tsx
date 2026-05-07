import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  'Available':   { bg: 'bg-green-100',  text: 'text-green-700'  },
  'In Progress': { bg: 'bg-blue-100',   text: 'text-blue-700'   },
  'Completed':   { bg: 'bg-green-100',  text: 'text-green-700'  },
  'Expired':     { bg: 'bg-red-100',    text: 'text-red-500'    },
};

export interface Errand {
  id: string;
  title: string;
  poster_name: string | null;
  budget: number | null;
  status: string;
  is_remote: boolean;
  created_at: string;
  _effectiveStatus?: string;
}

export default function ErrandCard({ errand }: { errand: Errand }) {
  const displayStatus = errand._effectiveStatus ?? errand.status;
  const style = STATUS_STYLES[displayStatus] ?? { bg: 'bg-gray-100', text: 'text-gray-600' };
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const btnRef = useRef<View>(null);
  const router = useRouter();

  const openMenu = () => {
    btnRef.current?.measureInWindow((x, y, width, height) => {
      setMenuPos({ x: x - 100, y: y + height + 4 });
      setMenuOpen(true);
    });
  };

  return (
    <View className="bg-white rounded-2xl px-4 py-3 border border-gray-100" style={{ flex: 1 }}>
      <View className="flex-row items-center justify-between">
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>{errand.title}</Text>
          <Text className="text-xs text-gray-500 mt-0.5">by {errand.poster_name ?? '—'}</Text>
        </View>
        <View className={`px-2 py-1 rounded-full ${style.bg}`}>
          <Text className={`text-xs font-medium ${style.text}`}>{displayStatus}</Text>
        </View>
        <View ref={btnRef} style={{ marginLeft: 8 }}>
          <TouchableOpacity onPress={openMenu} hitSlop={8}>
            <Ionicons name="ellipsis-vertical" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={{ flex: 1 }} onPress={() => setMenuOpen(false)}>
          <View style={{ position: 'absolute', top: menuPos.y, left: menuPos.x, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', minWidth: 140, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 6 }}>
            <TouchableOpacity
              onPress={() => { setMenuOpen(false); router.push(`/admin/errand/${errand.id}`); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
            >
              <Ionicons name="information-circle-outline" size={14} color="#374151" />
              <Text style={{ fontSize: 12, color: '#374151' }}>More Info</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMenuOpen(false)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 }}
            >
              <Ionicons name="trash-outline" size={14} color="#EF4444" />
              <Text style={{ fontSize: 12, color: '#EF4444' }}>Delete Errand</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
