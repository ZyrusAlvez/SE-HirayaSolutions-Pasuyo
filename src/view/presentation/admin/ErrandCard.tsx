import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { deleteErrandAdmin } from '@/controllers/adminController';
import { ERRAND_REASONS } from '@/controllers/reportController';
import { toast } from '@/utils/toast';

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  'Available':   { bg: 'bg-green-100',  text: 'text-green-700'  },
  'In Progress': { bg: 'bg-blue-100',   text: 'text-blue-700'   },
  'Completed':   { bg: 'bg-green-100',  text: 'text-green-700'  },
  'Expired':     { bg: 'bg-red-100',    text: 'text-red-500'    },
};

export interface Errand {
  id: string;
  user_id: string;
  title: string;
  poster_name: string | null;
  budget: number | null;
  status: string;
  is_remote: boolean;
  created_at: string;
  _effectiveStatus?: string;
}

export default function ErrandCard({ errand, onDelete, onLoadingChange }: { errand: Errand; onDelete?: () => void; onLoadingChange?: (loading: boolean) => void }) {
  const displayStatus = errand._effectiveStatus ?? errand.status;
  const style = STATUS_STYLES[displayStatus] ?? { bg: 'bg-gray-100', text: 'text-gray-600' };
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState(ERRAND_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const btnRef = useRef<View>(null);
  const router = useRouter();

  const openMenu = () => {
    btnRef.current?.measureInWindow((x, y, width, height) => {
      setMenuPos({ x: x - 120, y: y + height + 4 });
      setMenuOpen(true);
    });
  };

  const handleDelete = async () => {
    const reason = selectedReason === 'Other' ? customReason.trim() : selectedReason;
    if (!reason) return;
    setDeleteVisible(false);
    onLoadingChange?.(true);
    const result = await deleteErrandAdmin(errand.id, reason);
    onLoadingChange?.(false);
    if (!result.success) { toast({ title: result.error, preset: 'error' }); return; }
    toast({ title: 'Errand deleted.', preset: 'done' });
    onDelete?.();
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

      {/* Kebab Menu */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={{ flex: 1 }} onPress={() => setMenuOpen(false)}>
          <View style={{ position: 'absolute', top: menuPos.y, left: menuPos.x, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', minWidth: 160, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 6 }}>
            <TouchableOpacity
              onPress={() => { setMenuOpen(false); router.push(`/admin/errand/${errand.id}`); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
            >
              <Ionicons name="information-circle-outline" size={14} color="#374151" />
              <Text style={{ fontSize: 12, color: '#374151' }}>More Info</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setMenuOpen(false); router.push(`/admin/account/${errand.user_id}`); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
            >
              <Ionicons name="person-outline" size={14} color="#374151" />
              <Text style={{ fontSize: 12, color: '#374151' }}>About the Poster</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setMenuOpen(false); setDeleteVisible(true); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 }}
            >
              <Ionicons name="trash-outline" size={14} color="#EF4444" />
              <Text style={{ fontSize: 12, color: '#EF4444' }}>Delete Errand</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Delete Reason Modal */}
      <Modal visible={deleteVisible} transparent animationType="fade" onRequestClose={() => setDeleteVisible(false)}>
        <Pressable style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)', padding: 24 }} onPress={() => setDeleteVisible(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 360, maxHeight: '80%' }}>
            <View style={{ padding: 24, paddingBottom: 0 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 }}>Delete Errand</Text>
              <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 19, marginBottom: 16 }}>
                Select a reason for deleting "{errand.title}".
              </Text>
            </View>

            <ScrollView style={{ paddingHorizontal: 24 }} contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={true}>
              {ERRAND_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  activeOpacity={0.7}
                  onPress={() => setSelectedReason(reason)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: selectedReason === reason ? '#FEF2F2' : 'transparent', borderWidth: 1, borderColor: selectedReason === reason ? '#FECACA' : '#F3F4F6', marginBottom: 6 }}
                >
                  <Ionicons
                    name={selectedReason === reason ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={selectedReason === reason ? '#EF4444' : '#D1D5DB'}
                  />
                  <Text style={{ fontSize: 13, color: selectedReason === reason ? '#991B1B' : '#374151', fontWeight: selectedReason === reason ? '600' : '400', flex: 1 }}>{reason}</Text>
                </TouchableOpacity>
              ))}
              {selectedReason === 'Other' && (
                <TextInput
                  placeholder="Enter custom reason..."
                  placeholderTextColor="#9CA3AF"
                  value={customReason}
                  onChangeText={setCustomReason}
                  multiline
                  style={{ borderWidth: 1, borderColor: '#FECACA', borderRadius: 10, padding: 12, fontSize: 13, color: '#1F2937', minHeight: 60, marginTop: 4, backgroundColor: '#FEF2F2' } as any}
                />
              )}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, padding: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
              <TouchableOpacity onPress={() => setDeleteVisible(false)} activeOpacity={0.7} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} activeOpacity={0.7} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: (selectedReason === 'Other' && !customReason.trim()) ? '#FCA5A5' : '#EF4444', alignItems: 'center' }} disabled={selectedReason === 'Other' && !customReason.trim()}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
