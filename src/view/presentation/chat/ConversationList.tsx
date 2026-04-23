import { View, Text, FlatList, Image, Pressable, ActivityIndicator } from 'react-native';
import { Conversation } from '@/controllers/chatController';
import VerificationBadge from '@/view/components/VerificationBadge';

const DEFAULT_AVATAR = require('@/assets/images/default_profile.jpg');

const getAvatarSource = (avatar: string | null | undefined) =>
  avatar && avatar !== 'null' && avatar !== 'default' && avatar.trim() ? { uri: avatar } : DEFAULT_AVATAR;

type Props = {
  conversations: Conversation[];
  currentUserId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  fullWidth?: boolean;
  typingConvos?: Set<string>;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function formatPreview(message: string | undefined, senderId: string | undefined, currentUserId: string): { prefix: string; text: string; italic: boolean } {
  if (!message) return { prefix: '', text: 'No messages yet', italic: false };
  if (!senderId) {
    try {
      const parsed = JSON.parse(message);
      if (parsed?.type === 'errand_accepted') {
        const isMe = parsed.acceptedBy === currentUserId;
        return { prefix: isMe ? 'You: ' : '', text: 'Accepted Errand', italic: true };
      }
    } catch {}
    return { prefix: '', text: message, italic: true };
  }
  const isMe = senderId === currentUserId;
  if (message === 'Sent a photo') return { prefix: isMe ? 'You: ' : '', text: 'Sent a photo', italic: true };
  if (message === 'Sent a file') return { prefix: isMe ? 'You: ' : '', text: 'Sent a file', italic: true };
  return { prefix: isMe ? 'You: ' : '', text: message, italic: false };
}

function isSpecialPreview(message: string | undefined, senderId: string | undefined) {
  if (!message) return false;
  if (!senderId) return true;
  return message === '📷 Photo' || message.startsWith('📎 ');
}

export default function ConversationList({ conversations, currentUserId, selectedId, onSelect, loading, fullWidth, typingConvos }: Props) {
  const getOther = (c: Conversation) =>
    c.user1_id === currentUserId
      ? { name: c.user2_name, avatar: c.user2_avatar, verified: c.user2_verified }
      : { name: c.user1_name, avatar: c.user1_avatar, verified: c.user1_verified };

  return (
    <View style={{ width: fullWidth ? '100%' : 320, borderRightWidth: fullWidth ? 0 : 1, borderRightColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
      <Text style={{ padding: 16, fontWeight: '700', fontSize: 18, color: '#111827' }}>Messages</Text>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#6B7280" />
        </View>
      ) : conversations.length === 0 ? (
        <Text style={{ padding: 16, color: '#9CA3AF', fontSize: 14 }}>No conversations yet. Start browsing errands and chat with task posters.</Text>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => {
            const other = getOther(item);
            const selected = item.id === selectedId;
            const unread = !selected && !!item.last_message_sender_id && item.last_message_sender_id !== currentUserId && !item.last_message_is_read;
            return (
              <Pressable
                onPress={() => onSelect(item.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  paddingHorizontal: 16,
                  backgroundColor: selected ? '#EFF6FF' : unread ? '#F0F9FF' : 'transparent',
                  borderLeftWidth: selected ? 3 : 0,
                  borderLeftColor: '#3B82F6',
                }}
              >
                <View style={{ width: 40, marginRight: 12 }}>
                  <Image
                    source={getAvatarSource(other.avatar)}
                    style={{ width: 40, height: 40, borderRadius: 20 }}
                  />
                  <VerificationBadge status={other.verified ? 'verified' : 'not_verified'} variant="icon" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: unread ? '700' : '600', fontSize: 14, color: '#111827' }} numberOfLines={1}>
                    {other.name ?? 'Unknown'}
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                    <Text style={{ flex: 1, fontSize: 13, color: unread ? '#111827' : '#6B7280', fontWeight: unread ? '600' : '400' }} numberOfLines={1}>
                      {typingConvos?.has(item.id) ? (
                        <Text style={{ color: '#3B82F6', fontStyle: 'italic' }}>typing...</Text>
                      ) : (() => {
                        const preview = formatPreview(item.last_message, item.last_message_sender_id, currentUserId);
                        return (
                          <>
                            {preview.prefix ? <Text>{preview.prefix}</Text> : null}
                            <Text style={preview.italic ? { fontStyle: 'italic' } : undefined}>{preview.text}</Text>
                          </>
                        );
                      })()}
                    </Text>
                    <Text style={{ fontSize: 11, color: unread ? '#3B82F6' : '#9CA3AF', fontWeight: unread ? '600' : '400', marginLeft: 8 }}>
                      {timeAgo(item.last_message_at)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
