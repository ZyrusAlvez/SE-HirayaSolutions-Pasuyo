import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useProfile } from '@/context/ProfileContext';
import { loadConversations, loadMessages, handleSendMessage, startConversation, Conversation, Message } from '@/controllers/chatController';
import { subscribeToMessages } from '@/models/chatModel';
import { supabase } from '@/utils/supabase';
import Header from '@/view/components/Header';
import NavBar from '@/view/components/NavBar';
import ConversationList from '@/view/presentation/chat/ConversationList';
import ChatThread from '@/view/presentation/chat/ChatThread';

export default function ChatScreen() {
  const { avatarUrl, verificationStatus } = useProfile();
  const { userId: targetUserId } = useLocalSearchParams<{ userId?: string }>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      if (targetUserId) {
        const convoResult = await startConversation(user.id, targetUserId);
        if (convoResult.success) setSelectedId(convoResult.data);
      }

      const result = await loadConversations(user.id);
      if (result.success) setConversations(result.data);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setMessagesLoading(true);
    loadMessages(selectedId).then((result) => {
      if (result.success) setMessages(result.data);
      setMessagesLoading(false);
    });
  }, [selectedId]);

  useEffect(() => {
    const channel = subscribeToMessages((payload) => {
      const msg = payload.new as Message;
      if (msg.conversation_id === selectedId) {
        setMessages((prev) => [...prev, msg]);
      }
      setConversations((prev) =>
        prev
          .map((c) =>
            c.id === msg.conversation_id
              ? { ...c, last_message: msg.content, last_message_at: msg.created_at, unread_count: msg.sender_id !== currentUserId ? (c.unread_count ?? 0) + 1 : c.unread_count }
              : c
          )
          .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
      );
    });
    return () => { supabase.removeChannel(channel); };
  }, [selectedId, currentUserId]);

  const selectedConvo = conversations.find((c) => c.id === selectedId);
  const otherUser = selectedConvo
    ? selectedConvo.user1_id === currentUserId
      ? { name: selectedConvo.user2_name, avatar: selectedConvo.user2_avatar }
      : { name: selectedConvo.user1_name, avatar: selectedConvo.user1_avatar }
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <Header avatarUrl={avatarUrl} verificationStatus={verificationStatus} />
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <ConversationList
          conversations={conversations}
          currentUserId={currentUserId}
          selectedId={selectedId}
          onSelect={setSelectedId}
          loading={loading}
        />
        <ChatThread
          messages={messages}
          currentUserId={currentUserId}
          otherUser={otherUser}
          loading={messagesLoading}
          selected={!!selectedId}
          onSend={(content) => { if (selectedId) handleSendMessage(selectedId, currentUserId, content); }}
        />
      </View>
      <NavBar />
    </View>
  );
}
