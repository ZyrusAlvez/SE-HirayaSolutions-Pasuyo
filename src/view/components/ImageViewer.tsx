import { Modal, View, Image, Pressable, Text, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import * as Linking from 'expo-linking';

type Props = {
  visible: boolean;
  uri: string;
  fileName?: string;
  onClose: () => void;
};

export default function ImageViewer({ visible, uri, fileName, onClose }: Props) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      if (Platform.OS === 'web') {
        const res = await fetch(uri);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'image';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        await Linking.openURL(uri);
      }
    } catch {} finally {
      setDownloading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ position: 'absolute', top: 50, right: 20, left: 20, flexDirection: 'row', justifyContent: 'flex-end', gap: 16, zIndex: 10 }}>
          <Pressable onPress={handleDownload} disabled={downloading} style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 10 }}>
            {downloading
              ? <ActivityIndicator size={22} color="#FFFFFF" />
              : <Ionicons name="download-outline" size={22} color="#FFFFFF" />}
          </Pressable>
          <Pressable onPress={onClose} style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 10 }}>
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Image source={{ uri }} style={{ width: 340, height: 340, borderRadius: 8 }} resizeMode="contain" />
        </Pressable>
        {fileName && (
          <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 12 }}>{fileName}</Text>
        )}
      </Pressable>
    </Modal>
  );
}
