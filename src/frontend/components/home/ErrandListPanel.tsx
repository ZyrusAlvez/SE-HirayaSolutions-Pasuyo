import { View, Text, TouchableOpacity, ScrollView, Image, Modal, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

if (Platform.OS === 'android') UIManager.setLayoutAnimationEnabledExperimental?.(true);

interface Errand {
  id: string;
  title: string;
  description: string;
  location_lat: number;
  location_lng: number;
  location_name?: string;
  budget?: number;
  deadline?: string;
  images?: string[];
}

interface Props {
  errands: Errand[];
  visible: boolean;
  onClose: () => void;
  onSelect: (errand: Errand) => void;
}

export default function ErrandListPanel({ errands, visible, onClose, onSelect }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  if (!visible) return null;

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <>
      {/* Backdrop */}
      <TouchableOpacity
        onPress={onClose}
        activeOpacity={1}
        style={{ position: 'absolute', inset: 0, zIndex: 900 } as any}
      />

      {/* Panel */}
      <View style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: 300,
        backgroundColor: 'white',
        zIndex: 901,
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: -4, height: 0 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 12,
      }}>

        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 14, alignItems: 'flex-end' }}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 1, backgroundColor: '#F3F4F6' }} />

        {errands.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="location-outline" size={36} color="#E5E7EB" />
            <Text style={{ color: '#9CA3AF', marginTop: 8, fontSize: 12 }}>No errands nearby</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {errands.map((e, i) => {
              const expanded = expandedId === e.id;
              return (
                <View key={e.id} style={{ borderBottomWidth: i < errands.length - 1 ? 1 : 0, borderBottomColor: '#F3F4F6' }}>
                  {/* Collapsed row */}
                  <TouchableOpacity
                    onPress={() => toggle(e.id)}
                    activeOpacity={0.7}
                    style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 }} numberOfLines={1}>
                      {e.title}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {e.budget != null && (
                        <View style={{ backgroundColor: '#FFFBEB', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97706' }}>₱{e.budget}</Text>
                        </View>
                      )}
                      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color="#9CA3AF" />
                    </View>
                  </TouchableOpacity>

                  {/* Expanded details */}
                  {expanded && (
                    <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
                      <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 18, marginBottom: 10 }}>
                        {e.description}
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                        {e.deadline && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
                            <Ionicons name="time-outline" size={11} color="#9CA3AF" />
                            <Text style={{ fontSize: 11, color: '#6B7280', marginLeft: 3 }}>
                              {new Date(e.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              {' '}{new Date(e.deadline).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          </View>
                        )}
                        {e.location_name && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, maxWidth: '100%' }}>
                            <Ionicons name="location-outline" size={11} color="#9CA3AF" />
                            <Text style={{ fontSize: 11, color: '#6B7280', marginLeft: 3, flexShrink: 1 }} numberOfLines={1}>{e.location_name}</Text>
                          </View>
                        )}
                      </View>
                      {(e.images?.filter(Boolean).length ?? 0) > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                          {e.images!.filter(Boolean).map((uri, idx) => (
                            <TouchableOpacity key={idx} onPress={() => setPreviewUri(uri)} activeOpacity={0.8}>
                              <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 10, marginRight: 6 }} resizeMode="cover" />
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                      <TouchableOpacity
                        onPress={() => { onSelect(e); onClose(); }}
                        activeOpacity={0.8}
                        style={{ backgroundColor: '#FEA405', borderRadius: 10, paddingVertical: 8, alignItems: 'center' }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: 'white' }}>View on Map</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
      {/* Image preview modal */}
      <Modal visible={!!previewUri} transparent animationType="fade" onRequestClose={() => setPreviewUri(null)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' }}
          activeOpacity={1}
          onPress={() => setPreviewUri(null)}
        >
          {previewUri && (
            <Image source={{ uri: previewUri }} style={{ width: '90%', height: '70%', borderRadius: 12 }} resizeMode="contain" />
          )}
        </TouchableOpacity>
      </Modal>
    </>
  );
}
