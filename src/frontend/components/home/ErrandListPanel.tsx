import { View, Text, TouchableOpacity, ScrollView, Image, Modal, Animated, Platform, UIManager, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';

const DEFAULT_AVATAR = require('../../assets/images/default_profile.jpg');

const SCREEN_WIDTH = Dimensions.get('window').width;

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

function ErrandRow({ e, isLast, onSelect, onClose, onPreview, autoExpand }: {
  e: Errand; isLast: boolean;
  onSelect: (e: Errand) => void;
  onClose: () => void;
  onPreview: (images: string[], index: number) => void;
  autoExpand?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const animValue = useRef(new Animated.Value(0)).current;
  const chevronAnim = useRef(new Animated.Value(0)).current;

  const animate = (toExpand: boolean) => {
    setExpanded(toExpand);
    Animated.parallel([
      Animated.timing(animValue, { toValue: toExpand ? 1 : 0, duration: 300, useNativeDriver: false }),
      Animated.timing(chevronAnim, { toValue: toExpand ? 1 : 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    if (autoExpand) animate(true);
  }, [autoExpand]);

  const toggle = () => animate(!expanded);

  const chevronRotate = chevronAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const maxHeight = animValue.interpolate({ inputRange: [0, 1], outputRange: [0, 600] });
  const opacity = animValue.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });

  return (
    <View style={{ borderBottomWidth: isLast ? 0 : 1, borderBottomColor: '#F3F4F6' }}>
      <TouchableOpacity
        onPress={toggle}
        activeOpacity={0.7}
        style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
          <Image
            source={e.poster_avatar ? { uri: e.poster_avatar } : DEFAULT_AVATAR}
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
          <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
            <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
          </Animated.View>
        </View>
      </TouchableOpacity>

      <Animated.View style={{ maxHeight, overflow: 'hidden', opacity }}>
        <ExpandedContent e={e} onSelect={onSelect} onClose={onClose} onPreview={(idx) => onPreview(e.images!.filter(Boolean), idx)} />
      </Animated.View>
    </View>
  );
}

function ImageViewer({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(startIndex);
  const thumbScrollRef = useRef<ScrollView>(null);

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(images.length - 1, next));
    setIndex(clamped);
    thumbScrollRef.current?.scrollTo({ x: clamped * 62 - 62, animated: true });
  };

  return (
    <TouchableOpacity
      style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' }}
      activeOpacity={1}
      onPress={onClose}
    >
      {/* Main image */}
      <Image
        source={{ uri: images[index] }}
        style={{ width: SCREEN_WIDTH * 0.9, height: SCREEN_WIDTH * 0.9, borderRadius: 12 }}
        resizeMode="contain"
      />

      {/* Counter */}
      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 10 }}>
        {index + 1} / {images.length}
      </Text>

      {/* Left / Right arrows */}
      {index > 0 && (
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation(); go(index - 1); }}
          style={{ position: 'absolute', left: 16, padding: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999 }}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
      )}
      {index < images.length - 1 && (
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation(); go(index + 1); }}
          style={{ position: 'absolute', right: 16, padding: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999 }}
        >
          <Ionicons name="chevron-forward" size={24} color="white" />
        </TouchableOpacity>
      )}

      {/* Thumbnail strip */}
      <ScrollView
        ref={thumbScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ position: 'absolute', bottom: 40 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
      >
        {images.map((uri, i) => (
          <TouchableOpacity key={i} onPress={(e) => { e.stopPropagation(); go(i); }} activeOpacity={0.8}>
            <Image
              source={{ uri }}
              style={{
                width: 52, height: 52, borderRadius: 8,
                borderWidth: i === index ? 2 : 0,
                borderColor: '#FEA405',
                opacity: i === index ? 1 : 0.5,
              }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </TouchableOpacity>
  );
}

function ExpandedContent({ e, onSelect, onClose, onPreview }: {
  e: Errand;
  onSelect: (e: Errand) => void;
  onClose: () => void;
  onPreview: (index: number) => void;
}) {
  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
      {e.poster_name && (
        <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 6 }}>Posted by {e.poster_name}</Text>
      )}
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
            <TouchableOpacity key={idx} onPress={() => onPreview(idx)} activeOpacity={0.8}>
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
  );
}

function ErrandListContent({ errands, onSelect, onClose, expandedId, setPreview }: {
  errands: Errand[];
  onSelect: (e: Errand) => void;
  onClose: () => void;
  expandedId?: string | null;
  setPreview: (p: { images: string[]; index: number }) => void;
}) {
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
          onPreview={(images, index) => setPreview({ images, index })}
          autoExpand={e.id === expandedId}
        />
      ))}
    </ScrollView>
  );
}

export default function ErrandListPanel({ errands, visible, slideAnim, onClose, onSelect, expandedId, static: isStatic }: Props) {
  const [preview, setPreview] = useState<{ images: string[]; index: number } | null>(null);

  const modal = (
    <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
      {preview && <ImageViewer images={preview.images} startIndex={preview.index} onClose={() => setPreview(null)} />}
    </Modal>
  );

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
        <ErrandListContent errands={errands} onSelect={onSelect} onClose={onClose} expandedId={expandedId} setPreview={setPreview} />
        {modal}
      </View>
    );
  }

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <TouchableOpacity
        onPress={onClose}
        activeOpacity={1}
        style={{ position: 'absolute', inset: 0, zIndex: 900 } as any}
      />

      {/* Panel */}
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
        <ErrandListContent errands={errands} onSelect={onSelect} onClose={onClose} expandedId={expandedId} setPreview={setPreview} />
      </Animated.View>

      {modal}
    </>
  );
}
