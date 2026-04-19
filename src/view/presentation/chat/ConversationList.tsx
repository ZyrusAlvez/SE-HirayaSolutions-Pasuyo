import { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, Pressable, ActivityIndicator } from 'react-native';
import { Conversation } from '@/controllers/chatController';

const DEFAULT_AVATAR = require('@/assets/images/default_profile.jpg');

type Props = {
  conversations: Conversation[];
  currentUserId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
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

export default function ConversationList({ conversations, currentUserId, selectedId, onSelect, loading }: Props) {
  const getOther = (c: Conversation) =>
    c.user1_id === currentUserId
      ? { name: c.user2_name, avatar: c.user2_avatar }
      : { name: c.user1_name, avatar: c.user1_avatar };

  return (
    <View style={{ width: 320, borderRightWidth: 1, borderRightColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
      <Text style={{ padding: 16, fontWeight: '700', fontSize: 18, color: '#111827' }}>Messages</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color="#6B7280" />
      ) : conversations.length === 0 ? (
        <Text style={{ padding: 16, color: '#9CA3AF', fontSize: 14 }}>No conversations yet. Start browsing errands and chat with task posters.</Text>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => {
            const other = getOther(item);
            const selected = item.id === selectedId;
            return (
              <Pressable
                onPress={() => onSelect(item.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  paddingHorizontal: 16,
                  backgroundColor: selected ? '#EFF6FF' : 'transparent',
                  borderLeftWidth: selected ? 3 : 0,
                  borderLeftColor: '#3B82F6',
                }}
              >
                <Image
                  source={other.avatar ? { uri: other.avatar } : DEFAULT_AVATAR}
                  style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontWeight: '600', fontSize: 14, color: '#111827' }} numberOfLines={1}>
                      {other.name ?? 'Unknown'}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#9CA3AF' }}>
                      {timeAgo(item.last_message_at)}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }} numberOfLines={1}>
                    {item.last_message || 'No messages yet'}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
