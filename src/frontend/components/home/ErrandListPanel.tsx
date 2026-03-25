import { View, Text, TouchableOpacity, ScrollView, Image, Animated, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';

const DEFAULT_AVATAR = require('../../assets/images/default_profile.jpg');

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
  poster_name?: string;
  poster_avatar?: string;
}

interface Props {
  errands: Errand[];
  visible: boolean;
  slideAnim: Animated.Value;
  onClose: () => void;
  onSelect: (errand: Errand) => void;
  expandedId?: string | null;
  static?: boolean;
}

function ErrandRow({ e, isLast, onSelect, onClose, onMoreInfo, expanded, onToggle }: {
  e: Errand; isLast: boolean;
  onSelect: (e: Errand) => void;
  onClose: () => void;
  onMoreInfo: (e: Errand) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, { toValue: expanded ? 1 : 0, duration: 250, useNativeDriver: false }).start();
  }, [expanded]);

  const maxHeight = animValue.interpolate({ inputRange: [0, 1], outputRange: [0, 60] });
  const opacity = animValue.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });

  return (
    <View style={{ borderBottomWidth: isLast ? 0 : 1, borderBottomColor: '#F3F4F6' }}>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
          <Image
            source={e.poster_avatar && e.poster_avatar !== 'default' ? { uri: e.poster_avatar } : DEFAULT_AVATAR}
            style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }}
          />
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', flex: 1 }} numberOfLines={1}>
            {e.title}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {e.budget != null && (
            <View style={{ backgroundColor: '#FFFBEB', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97706' }}>₱{e.budget}</Text>
            </View>
          )}
          <Animated.View style={{ transform: [{ rotate: animValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
            <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
          </Animated.View>
        </View>
      </TouchableOpacity>

      <Animated.View style={{ maxHeight, overflow: 'hidden', opacity }}>
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 }}>
          <TouchableOpacity
            onPress={() => onMoreInfo(e)}
            activeOpacity={0.8}
            style={{ flex: 1, backgroundColor: '#FEA405', borderRadius: 10, paddingVertical: 8, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: 'white' }}>More Info</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { onSelect(e); onClose(); }}
            activeOpacity={0.8}
            style={{ flex: 1, borderWidth: 1, borderColor: '#FEA405', borderRadius: 10, paddingVertical: 8, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#FEA405' }}>View on Map</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

function ErrandListContent({ errands, onSelect, onClose, expandedId: initialExpandedId, onMoreInfo }: {
  errands: Errand[];
  onSelect: (e: Errand) => void;
  onClose: () => void;
  expandedId?: string | null;
  onMoreInfo: (e: Errand) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(initialExpandedId ?? null);

  const toggle = (id: string) => setActiveId(prev => prev === id ? null : id);

  return errands.length === 0 ? (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="location-outline" size={36} color="#E5E7EB" />
      <Text style={{ color: '#9CA3AF', marginTop: 8, fontSize: 12 }}>No errands nearby</Text>
    </View>
  ) : (
    <ScrollView showsVerticalScrollIndicator={false}>
      {errands.map((e, i) => (
        <ErrandRow
          key={e.id}
          e={e}
          isLast={i === errands.length - 1}
          onSelect={onSelect}
          onClose={onClose}
          onMoreInfo={onMoreInfo}
          expanded={activeId === e.id}
          onToggle={() => toggle(e.id)}
        />
      ))}
    </ScrollView>
  );
}

export default function ErrandListPanel({ errands, visible, slideAnim, onClose, onSelect, expandedId, static: isStatic }: Props) {
  const onMoreInfo = (e: Errand) => {
    // TODO: wire up to a detail modal/screen
    console.log('More info:', e.id);
  };

  if (isStatic) {
    return (
      <View style={{
        width: 300,
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 4,
      }}>
        <ErrandListContent errands={errands} onSelect={onSelect} onClose={onClose} expandedId={expandedId} onMoreInfo={onMoreInfo} />
      </View>
    );
  }

  if (!visible) return null;

  return (
    <>
      <TouchableOpacity
        onPress={onClose}
        activeOpacity={1}
        style={{ position: 'absolute', inset: 0, zIndex: 900 } as any}
      />
      <Animated.View style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: '75%',
        backgroundColor: 'white',
        zIndex: 901,
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: -4, height: 0 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 12,
        transform: [{ translateX: slideAnim }],
      }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 14, alignItems: 'flex-end' }}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
        <View style={{ height: 1, backgroundColor: '#F3F4F6' }} />
        <ErrandListContent errands={errands} onSelect={onSelect} onClose={onClose} expandedId={expandedId} onMoreInfo={onMoreInfo} />
      </Animated.View>
    </>
  );
}
