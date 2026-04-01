import { useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, FlatList, Platform, PanResponder, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const ACCENT = '#FEA405';

interface Props {
  images: string[];
  activeIndex: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export default function ErrandImageLightbox({ images, activeIndex, onClose, onIndexChange }: Props) {
  const { width } = useWindowDimensions();
  const IMG_BASE = width * 0.72;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
      onPanResponderRelease: (_, g) => {
        if (activeIndex === null) return;
        if (g.dx < -40 && activeIndex < images.length - 1) onIndexChange(activeIndex + 1);
        else if (g.dx > 40 && activeIndex > 0) onIndexChange(activeIndex - 1);
      },
    })
  ).current;

  return (
    <Modal visible={activeIndex !== null} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={60} tint="dark" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} activeOpacity={1} onPress={onClose} />

        {/* Image + arrows */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            onPress={() => activeIndex !== null && activeIndex > 0 && onIndexChange(activeIndex - 1)}
            disabled={activeIndex === 0}
            style={{ padding: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 22, opacity: activeIndex === 0 ? 0.25 : 1 }}
          >
            <Ionicons name="chevron-back" size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()} {...panResponder.panHandlers}>
            {activeIndex !== null && (
              <View style={{ width: IMG_BASE, height: IMG_BASE * 0.75, overflow: 'hidden', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                <Image
                  source={{ uri: images[activeIndex] }}
                  style={{ width: IMG_BASE, height: IMG_BASE * 0.75 }}
                  resizeMode="contain"
                />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => activeIndex !== null && activeIndex < images.length - 1 && onIndexChange(activeIndex + 1)}
            disabled={activeIndex === images.length - 1}
            style={{ padding: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 22, opacity: activeIndex === images.length - 1 ? 0.25 : 1 }}
          >
            <Ionicons name="chevron-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Counter */}
        {activeIndex !== null && images.length > 1 && (
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 12 }}>
            {activeIndex + 1} / {images.length}
          </Text>
        )}

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()}
            style={{ position: 'absolute', bottom: Platform.OS !== 'web' ? 40 : 24, left: 0, right: 0, alignItems: 'center' }}
          >
            <FlatList
              data={images}
              horizontal
              keyExtractor={(_, i) => String(i)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
              renderItem={({ item, index }) => (
                <TouchableOpacity onPress={() => onIndexChange(index)} activeOpacity={0.8}>
                  <Image
                    source={{ uri: item }}
                    style={{
                      width: 52, height: 52, borderRadius: 10,
                      borderWidth: activeIndex === index ? 2 : 1,
                      borderColor: activeIndex === index ? ACCENT : 'rgba(255,255,255,0.25)',
                      opacity: activeIndex === index ? 1 : 0.5,
                    }}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
            />
          </TouchableOpacity>
        )}
      </BlurView>
    </Modal>
  );
}
