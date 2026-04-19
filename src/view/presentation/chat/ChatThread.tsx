import { useState } from 'react';
import { View, Text, TextInput, FlatList, Image, Pressable, ActivityIndicator } from 'react-native';
import { Message } from '@/controllers/chatController';

const DEFAULT_AVATAR = require('@/assets/images/default_profile.jpg');

type Props = {
  messages: Message[];
  currentUserId: string;
  otherUser: { name: string; avatar: string | null } | null;
  loading: boolean;
  selected: boolean;
  onSend: (content: string) => void;
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatThread({ messages, currentUserId, otherUser, loading, selected, onSend }: Props) {
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

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
        <Image
          source={otherUser?.avatar ? { uri: otherUser.avatar } : DEFAULT_AVATAR}
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
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const isMe = item.sender_id === currentUserId;
            return (
              <View style={{ alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                <View style={{
                  maxWidth: '70%',
                  backgroundColor: isMe ? '#3B82F6' : '#F3F4F6',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}>
                  <Text style={{ color: isMe ? '#FFFFFF' : '#111827', fontSize: 14 }}>{item.content}</Text>
                </View>
                <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{formatTime(item.created_at)}</Text>
              </View>
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
