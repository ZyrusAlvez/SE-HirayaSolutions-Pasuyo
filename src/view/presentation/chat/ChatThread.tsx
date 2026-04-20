import { useState } from 'react';
import { View, Text, TextInput, FlatList, Image, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message, MessageStatus } from '@/controllers/chatController';

const DEFAULT_AVATAR = require('@/assets/images/default_profile.jpg');

const getAvatarSource = (avatar: string | null | undefined) =>
  avatar && avatar !== 'null' && avatar !== 'default' && avatar.trim() ? { uri: avatar } : DEFAULT_AVATAR;

type Props = {
  messages: Message[];
  currentUserId: string;
  otherUser: { name: string; avatar: string | null } | null;
  loading: boolean;
  selected: boolean;
  onSend: (content: string) => void;
  onBack?: () => void;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const FIVE_MINUTES = 5 * 60 * 1000;

function shouldShowTimeSeparator(current: Message, previous: Message | undefined) {
  if (!previous) return true;
  return new Date(current.created_at).getTime() - new Date(previous.created_at).getTime() > FIVE_MINUTES;
}

function formatSeparatorTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 0) return time;
  if (diffDays === 1) return `Yesterday ${time}`;
  if (diffDays < 7) return `${d.toLocaleDateString([], { weekday: 'short' })} ${time}`;
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`;
}

function StatusIndicator({ status, otherAvatar }: { status?: MessageStatus; otherAvatar?: string | null }) {
  if (!status) return null;
  if (status === 'sending') return <ActivityIndicator size={10} color="#9CA3AF" style={{ marginTop: 2 }} />;
  if (status === 'seen') return (
    <Image
      source={getAvatarSource(otherAvatar)}
      style={{ width: 14, height: 14, borderRadius: 7, marginTop: 2 }}
    />
  );
  // sent
  return <Ionicons name="checkmark-circle" size={14} color="#9CA3AF" style={{ marginTop: 2 }} />;
}

function getStatusLabel(status?: MessageStatus) {
  if (status === 'sending') return 'Sending...';
  if (status === 'seen') return 'Seen';
  if (status === 'sent') return 'Sent';
  return null;
}

function MessageBubble({ item, isMe, otherAvatar, isLastOwn }: { item: Message; isMe: boolean; otherAvatar?: string | null; isLastOwn: boolean }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <Pressable
      onPress={() => setRevealed((v) => !v)}
      style={{ alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: 4 }}
    >
      <View style={{
        maxWidth: '70%',
        backgroundColor: isMe ? '#3B82F6' : '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}>
        <Text style={{ color: isMe ? '#FFFFFF' : '#111827', fontSize: 14 }}>{item.content}</Text>
      </View>
      {revealed && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <Text style={{ fontSize: 10, color: '#9CA3AF' }}>{formatTime(item.created_at)}</Text>
          {isMe && getStatusLabel(item._status) && (
            <Text style={{ fontSize: 10, color: '#9CA3AF' }}> · {getStatusLabel(item._status)}</Text>
          )}
        </View>
      )}
      {isMe && isLastOwn && !revealed && (
        <View style={{ alignItems: 'flex-end' }}>
          <StatusIndicator status={item._status} otherAvatar={otherAvatar} />
        </View>
      )}
    </Pressable>
  );
}

export default function ChatThread({ messages, currentUserId, otherUser, loading, selected, onSend, onBack, onLoadMore, loadingMore, hasMore }: Props) {
  const [input, setInput] = useState('');

  if (!selected) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
        <Text style={{ color: '#9CA3AF', fontSize: 14 }}>Select a conversation to start chatting</Text>
      </View>
    );
  }

  const send = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  const lastOwnMsgId = [...messages].reverse().find((m) => m.sender_id === currentUserId)?.id;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
        {onBack && (
          <Pressable onPress={onBack} style={{ marginRight: 8 }}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
        )}
        <Image
          source={getAvatarSource(otherUser?.avatar)}
          style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }}
        />
        <Text style={{ fontWeight: '700', fontSize: 16, color: '#111827' }}>{otherUser?.name ?? 'Unknown'}</Text>
      </View>
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color="#6B7280" />
      ) : messages.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#9CA3AF', fontSize: 14 }}>No messages yet. Say hello!</Text>
        </View>
      ) : (
        <FlatList
          data={[...messages].reverse()}
          inverted
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16 }}
          onEndReached={hasMore ? onLoadMore : undefined}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 12 }} color="#6B7280" /> : null}
          renderItem={({ item, index }) => {
            const actualIndex = messages.length - 1 - index;
            const isMe = item.sender_id === currentUserId;
            const prev = actualIndex > 0 ? messages[actualIndex - 1] : undefined;
            const showSeparator = shouldShowTimeSeparator(item, prev);
            return (
              <>
                <MessageBubble
                  item={item}
                  isMe={isMe}
                  otherAvatar={otherUser?.avatar}
                  isLastOwn={isMe && item.id === lastOwnMsgId}
                />
                {showSeparator && (
                  <Text style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF', marginVertical: 12 }}>
                    {formatSeparatorTime(item.created_at)}
                  </Text>
                )}
              </>
            );
          }}
        />
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={send}
          placeholder="Type a message..."
          placeholderTextColor="#9CA3AF"
          style={{
            flex: 1,
            backgroundColor: '#F3F4F6',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            fontSize: 14,
            color: '#111827',
            outlineStyle: 'none',
          }}
        />
        <Pressable
          onPress={send}
          style={{
            marginLeft: 8,
            backgroundColor: input.trim() ? '#3B82F6' : '#D1D5DB',
            borderRadius: 20,
            paddingHorizontal: 20,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}
