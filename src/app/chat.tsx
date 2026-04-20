import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Platform, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useProfile } from '@/context/ProfileContext';
import { loadConversations, loadMessages, handleSendMessage, handleSendFile, markAsRead, startConversation, Conversation, Message } from '@/controllers/chatController';
import { subscribeToMessages, subscribeToTyping, broadcastTyping } from '@/models/chatModel';
import { getLastSeen } from '@/models/presenceModel';
import { usePresence } from '@/context/PresenceContext';
import { supabase } from '@/utils/supabase';
import Header from '@/view/components/Header';
import NavBar from '@/view/components/NavBar';
import ConversationList from '@/view/presentation/chat/ConversationList';
import ChatThread from '@/view/presentation/chat/ChatThread';

const MOBILE_BREAKPOINT = 600;

export default function ChatScreen() {
  const { avatarUrl, verificationStatus } = useProfile();
  const { onlineUsers } = usePresence();
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
  const [otherTyping, setOtherTyping] = useState(false);
  const [typingConvos, setTypingConvos] = useState<Set<string>>(new Set());
  const [otherLastSeen, setOtherLastSeen] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingConvoTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const lastTypingBroadcast = useRef(0);

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
      prev.map((c) => c.id === selectedId ? { ...c, last_message_is_read: true } : c)
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

    const channel = subscribeToMessages(
      // INSERT
      (payload) => {
        const msg = payload.new as Message;
        const selId = selectedIdRef.current;
        const uid = currentUserIdRef.current;

        // Skip own messages in selected conversation (already added optimistically)
        if (msg.sender_id === uid && msg.conversation_id === selId) return;

        if (msg.conversation_id === selId) {
          setMessages((prev) => [...prev, msg]);
          // Clear typing indicator since they sent a message
          setOtherTyping(false);
          if (typingTimeoutRef.current) { clearTimeout(typingTimeoutRef.current); typingTimeoutRef.current = null; }
          // Auto mark as read + mark own messages as seen
          markAsRead(selId!, uid);
        }

        // Clear typing for this conversation since a message was sent
        setTypingConvos((prev) => {
          const next = new Set(prev);
          next.delete(msg.conversation_id);
          return next;
        });

        setConversations((prev) =>
          prev
            .map((c) =>
              c.id === msg.conversation_id
                ? {
                    ...c,
                    last_message: msg.content,
                    last_message_at: msg.created_at,
                    last_message_sender_id: msg.sender_id,
                    last_message_is_read: msg.conversation_id === selId,
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

  // Typing indicator subscription for selected conversation (thread)
  useEffect(() => {
    if (!selectedId || !currentUserId) return;
    const channel = subscribeToTyping(selectedId, (userId) => {
      if (userId === currentUserId) return;
      setOtherTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 3000);
    });
    return () => {
      supabase.removeChannel(channel);
      setOtherTyping(false);
    };
  }, [selectedId, currentUserId]);

  // Typing indicator subscriptions for all conversations (list)
  useEffect(() => {
    if (!currentUserId || conversations.length === 0) return;
    const channels = conversations.map((c) =>
      subscribeToTyping(c.id, (userId) => {
        if (userId === currentUserId) return;
        setTypingConvos((prev) => new Set(prev).add(c.id));
        if (typingConvoTimeouts.current[c.id]) clearTimeout(typingConvoTimeouts.current[c.id]);
        typingConvoTimeouts.current[c.id] = setTimeout(() => {
          setTypingConvos((prev) => {
            const next = new Set(prev);
            next.delete(c.id);
            return next;
          });
        }, 3000);
      })
    );
    return () => { channels.forEach((ch) => supabase.removeChannel(ch)); };
  }, [currentUserId, conversations.length]);

  const handleTyping = useCallback(() => {
    if (!selectedId || !currentUserId) return;
    const now = Date.now();
    if (now - lastTypingBroadcast.current < 2000) return; // Throttle to every 2s
    lastTypingBroadcast.current = now;
    broadcastTyping(selectedId, currentUserId);
  }, [selectedId, currentUserId]);

  const onSendFile = useCallback(async (uri: string, fileName: string, mimeType: string) => {
    if (!selectedId || !currentUserId) return;

    const tempId = `temp-${Date.now()}`;
    const isImage = mimeType.startsWith('image/');
    const optimistic: Message = {
      id: tempId,
      conversation_id: selectedId,
      sender_id: currentUserId,
      content: isImage ? '📷 Photo' : `📎 ${fileName}`,
      is_read: false,
      created_at: new Date().toISOString(),
      file_url: uri,
      file_name: fileName,
      file_type: mimeType,
      _status: 'sending',
    };
    setMessages((prev) => [...prev, optimistic]);

    const result = await handleSendFile(selectedId, currentUserId, uri, fileName, mimeType);
    if (result.success) {
      setMessages((prev) =>
        prev.map((m) => m.id === tempId ? { ...result.data, _status: 'sent' } : m)
      );
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  }, [selectedId, currentUserId]);

  const selectedConvo = conversations.find((c) => c.id === selectedId);
  const otherUserId = selectedConvo
    ? selectedConvo.user1_id === currentUserId ? selectedConvo.user2_id : selectedConvo.user1_id
    : null;
  const otherUser = selectedConvo
    ? selectedConvo.user1_id === currentUserId
      ? { name: selectedConvo.user2_name, avatar: selectedConvo.user2_avatar }
      : { name: selectedConvo.user1_name, avatar: selectedConvo.user1_avatar }
    : null;
  const otherIsOnline = otherUserId ? onlineUsers.has(otherUserId) : false;

  // Fetch last_seen when selecting a conversation (only if offline)
  useEffect(() => {
    if (!otherUserId) { setOtherLastSeen(null); return; }
    if (otherIsOnline) { setOtherLastSeen(null); return; }
    getLastSeen(otherUserId).then(setOtherLastSeen);
  }, [otherUserId, otherIsOnline]);

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
            typingConvos={typingConvos}
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
            onSendFile={onSendFile}
            onBack={isMobile ? () => setSelectedId(null) : undefined}
            onLoadMore={handleLoadMore}
            loadingMore={loadingMore}
            hasMore={hasMore}
            otherTyping={otherTyping}
            onTyping={handleTyping}
            otherIsOnline={otherIsOnline}
            otherLastSeen={otherLastSeen}
          />
        )}
      </View>
      <NavBar />
    </View>
  );
}
