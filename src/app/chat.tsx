import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useProfile } from '@/context/ProfileContext';
import { loadConversations, loadMessages, Conversation, Message } from '@/controllers/chatController';
import { supabase } from '@/utils/supabase';
import Header from '@/view/components/Header';
import NavBar from '@/view/components/NavBar';
import ConversationList from '@/view/presentation/chat/ConversationList';
import ChatThread from '@/view/presentation/chat/ChatThread';

export default function ChatScreen() {
  const { avatarUrl, verificationStatus } = useProfile();
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

      const result = await loadConversations();
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
        />
      </View>
      <NavBar />
    </View>
  );
}
