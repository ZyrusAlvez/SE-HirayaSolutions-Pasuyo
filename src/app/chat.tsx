import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Platform, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useProfile } from '@/context/ProfileContext';
import { loadConversations, loadMessages, handleSendMessage, markAsRead, startConversation, Conversation, Message } from '@/controllers/chatController';
import { subscribeToMessages } from '@/models/chatModel';
import { supabase } from '@/utils/supabase';
import Header from '@/view/components/Header';
import NavBar from '@/view/components/NavBar';
import ConversationList from '@/view/presentation/chat/ConversationList';
import ChatThread from '@/view/presentation/chat/ChatThread';

const MOBILE_BREAKPOINT = 600;

export default function ChatScreen() {
  const { avatarUrl, verificationStatus } = useProfile();
  const { userId: targetUserId } = useLocalSearchParams<{ userId?: string }>();
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Refs so realtime callbacks always have latest values
  const selectedIdRef = useRef(selectedId);
  const currentUserIdRef = useRef(currentUserId);
  selectedIdRef.current = selectedId;
  currentUserIdRef.current = currentUserId;

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const user = session.user;
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

  // Load messages + mark as read when selecting a conversation
  useEffect(() => {
    if (!selectedId || !currentUserId) return;
    setMessagesLoading(true);
    setMessages([]);
    setHasMore(false);
    loadMessages(selectedId, 0, currentUserId).then((result) => {
      if (result.success) {
        setMessages(result.data.messages);
        setHasMore(result.data.hasMore);
      }
      setMessagesLoading(false);
    });
    markAsRead(selectedId, currentUserId);
    setConversations((prev) =>
      prev.map((c) => c.id === selectedId ? { ...c, unread_count: 0 } : c)
    );
  }, [selectedId]);

  const handleLoadMore = useCallback(() => {
    if (!selectedId || loadingMore || !hasMore) return;
    setLoadingMore(true);
    loadMessages(selectedId, messages.length, currentUserId).then((result) => {
      if (result.success) {
        setMessages((prev) => [...result.data.messages, ...prev]);
        setHasMore(result.data.hasMore);
      }
      setLoadingMore(false);
    });
  }, [selectedId, loadingMore, hasMore, messages.length]);

  const onSend = useCallback(async (content: string) => {
    if (!selectedId || !currentUserId) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      conversation_id: selectedId,
      sender_id: currentUserId,
      content: content.trim(),
      is_read: false,
      created_at: new Date().toISOString(),
      _status: 'sending',
    };
    setMessages((prev) => [...prev, optimistic]);

    const result = await handleSendMessage(selectedId, currentUserId, content);
    if (result.success) {
      setMessages((prev) =>
        prev.map((m) => m.id === tempId ? { ...result.data, _status: 'sent' } : m)
      );
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  }, [selectedId, currentUserId]);

  // Single realtime subscription — uses refs to avoid stale closures
  useEffect(() => {
    if (!currentUserId) return;

    console.log('Subscribing to realtime messages, userId:', currentUserId);

    const channel = subscribeToMessages(
      // INSERT
      (payload) => {
        console.log('Realtime INSERT received:', payload.new);
        const msg = payload.new as Message;
        const selId = selectedIdRef.current;
        const uid = currentUserIdRef.current;

        // Skip own messages in selected conversation (already added optimistically)
        if (msg.sender_id === uid && msg.conversation_id === selId) return;

        if (msg.conversation_id === selId) {
          setMessages((prev) => [...prev, msg]);
          // Auto mark as read + mark own messages as seen
          markAsRead(selId!, uid);
        }

        setConversations((prev) =>
          prev
            .map((c) =>
              c.id === msg.conversation_id
                ? {
                    ...c,
                    last_message: msg.content,
                    last_message_at: msg.created_at,
                    unread_count: msg.sender_id !== uid && msg.conversation_id !== selId
                      ? (c.unread_count ?? 0) + 1
                      : c.unread_count,
                  }
                : c
            )
            .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
        );
      },
      // UPDATE — messages marked as read
      (payload) => {
        const updated = payload.new as Message;
        const uid = currentUserIdRef.current;

        // Our messages were marked as read by the other user
        if (updated.is_read && updated.sender_id === uid) {
          setMessages((prev) =>
            prev.map((m) =>
              m.sender_id === uid && !m.is_read
                ? { ...m, is_read: true, _status: 'seen' }
                : m
            )
          );
        }
      },
    );
    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);

  const selectedConvo = conversations.find((c) => c.id === selectedId);
  const otherUser = selectedConvo
    ? selectedConvo.user1_id === currentUserId
      ? { name: selectedConvo.user2_name, avatar: selectedConvo.user2_avatar }
      : { name: selectedConvo.user1_name, avatar: selectedConvo.user1_avatar }
    : null;

  const showThread = isMobile ? !!selectedId : true;
  const showList = isMobile ? !selectedId : true;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <Header avatarUrl={avatarUrl} verificationStatus={verificationStatus} />
      <View style={[{ flex: 1, flexDirection: 'row' }, Platform.OS === 'web' && { maxWidth: 1200, width: '100%', alignSelf: 'center' as const }]}>
        {showList && (
          <ConversationList
            conversations={conversations}
            currentUserId={currentUserId}
            selectedId={selectedId}
            onSelect={setSelectedId}
            loading={loading}
            fullWidth={isMobile}
          />
        )}
        {showThread && (
          <ChatThread
            messages={messages}
            currentUserId={currentUserId}
            otherUser={otherUser}
            loading={messagesLoading}
            selected={!!selectedId}
            onSend={onSend}
            onBack={isMobile ? () => setSelectedId(null) : undefined}
            onLoadMore={handleLoadMore}
            loadingMore={loadingMore}
            hasMore={hasMore}
          />
        )}
      </View>
      <NavBar />
    </View>
  );
}
