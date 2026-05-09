import { View, Text, Image, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Message } from '@/controllers/chatController';

const FILE_EXT_COLORS: Record<string, string> = {
  pdf: '#EF4444', doc: '#2563EB', docx: '#2563EB', xls: '#16A34A', xlsx: '#16A34A',
  ppt: '#EA580C', pptx: '#EA580C', zip: '#8B5CF6', rar: '#8B5CF6', txt: '#6B7280',
  csv: '#16A34A', mp4: '#EC4899', mov: '#EC4899', mp3: '#F59E0B', wav: '#F59E0B',
};

const FILE_EXT_ICONS: Record<string, string> = {
  pdf: 'document-text', doc: 'document-text', docx: 'document-text',
  xls: 'grid', xlsx: 'grid', csv: 'grid',
  ppt: 'easel', pptx: 'easel',
  zip: 'file-tray-stacked', rar: 'file-tray-stacked',
  mp4: 'film', mov: 'film',
  mp3: 'musical-notes', wav: 'musical-notes',
  txt: 'document-text',
};

function getFileExt(name?: string | null) {
  if (!name) return '';
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

function handleDownload(url: string, name: string) {
  if (Platform.OS === 'web') {
    fetch(url).then(r => r.blob()).then(blob => {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    });
  } else {
    Linking.openURL(url);
  }
}

type Props = {
  item: Message;
  isMe: boolean;
  onImagePress?: () => void;
};

export default function FileBubble({ item, isMe, onImagePress }: Props) {
  if (item.file_type?.startsWith('image/')) {
    return (
      <Pressable testID={`file-bubble-image-${item.id}`} onPress={onImagePress}>
        <Image source={{ uri: item.file_url! }} style={{ width: 200, height: 200, borderRadius: 12 }} resizeMode="cover" />
      </Pressable>
    );
  }

  const ext = getFileExt(item.file_name);
  const accentColor = FILE_EXT_COLORS[ext] || '#6B7280';
  const iconName = (FILE_EXT_ICONS[ext] || 'document') as any;

  return (
    <Pressable testID={`file-bubble-${item.id}`} onPress={() => item.file_url && handleDownload(item.file_url, item.file_name || 'file')} style={{ width: 220 }}>
      <View style={{
        borderRadius: 14,
        borderWidth: 1,
        borderColor: isMe ? 'rgba(255,255,255,0.15)' : '#E5E7EB',
        backgroundColor: isMe ? 'rgba(255,255,255,0.08)' : '#F9FAFB',
        overflow: 'hidden',
      }}>
        <View style={{
          backgroundColor: accentColor + '14',
          paddingVertical: 16,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <View style={{
            width: 48, height: 48, borderRadius: 12,
            backgroundColor: accentColor + '20',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name={iconName} size={24} color={accentColor} />
          </View>
          {ext ? (
            <View style={{
              marginTop: 6,
              backgroundColor: accentColor,
              paddingHorizontal: 8, paddingVertical: 2,
              borderRadius: 4,
            }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF', textTransform: 'uppercase' }}>{ext}</Text>
            </View>
          ) : null}
        </View>
        <View style={{ paddingHorizontal: 12, paddingVertical: 10, backgroundColor: isMe ? '#2563EB' : '#FFFFFF' }}>
          <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '600', color: isMe ? '#FFFFFF' : '#111827' }}>
            {item.file_name ?? 'File'}
          </Text>
          <Text style={{ fontSize: 11, color: isMe ? 'rgba(255,255,255,0.7)' : '#9CA3AF', marginTop: 2 }}>Tap to download</Text>
        </View>
      </View>
    </Pressable>
  );
}
