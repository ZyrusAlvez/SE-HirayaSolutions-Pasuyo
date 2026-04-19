import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useProfile } from '@/context/ProfileContext';
import { loadConversations, Conversation } from '@/controllers/chatController';
import { supabase } from '@/utils/supabase';
import Header from '@/view/components/Header';
import NavBar from '@/view/components/NavBar';
import ConversationList from '@/view/presentation/chat/ConversationList';
import ChatThread from '@/view/presentation/chat/ChatThread';

export default function ChatScreen() {
  const { avatarUrl, verificationStatus } = useProfile();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);

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
        <ChatThread />
      </View>
      <NavBar />
    </View>
  );
}
