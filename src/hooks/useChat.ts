import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { usePathname } from 'expo-router';
import { loadConversations, loadMessages, handleSendMessage, handleSendFile, markAsRead, startConversation, Conversation, Message } from '@/controllers/chatController';
import { subscribeToMessages, subscribeToTyping, broadcastTyping } from '@/models/chatModel';
import { getLastSeen } from '@/models/presenceModel';
import { usePresence } from '@/context/PresenceContext';
import { supabase } from '@/utils/supabase';
import { toast } from '@/utils/toast';

export function useChat(targetUserId?: string) {
  const { onlineUsers } = usePresence();
  const pathname = usePathname();
  const isChatActive = pathname === '/chat';
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
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingConvoTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const lastTypingBroadcast = useRef(0);

  const selectedIdRef = useRef(selectedId);
  const currentUserIdRef = useRef(currentUserId);
  const isChatActiveRef = useRef(isChatActive);
  selectedIdRef.current = selectedId;
  currentUserIdRef.current = currentUserId;
  isChatActiveRef.current = isChatActive;

  // Init: auth, target user, load conversations
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

  // Load messages + mark as read
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
    if (isChatActive) markAsRead(selectedId, currentUserId);
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
      setConversations((prev) =>
        prev
          .map((c) =>
            c.id === selectedId
              ? { ...c, last_message: content.trim(), last_message_at: result.data.created_at, last_message_sender_id: currentUserId, last_message_is_read: false }
              : c
          )
          .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
      );
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  }, [selectedId, currentUserId]);

  const onSendFile = useCallback(async (uri: string, fileName: string, mimeType: string, fileSize?: number) => {
    if (!selectedId || !currentUserId) return;

    const tempId = `temp-${Date.now()}`;
    const isImage = mimeType.startsWith('image/');
    const optimistic: Message = {
      id: tempId,
      conversation_id: selectedId,
      sender_id: currentUserId,
      content: isImage ? 'Sent a photo' : 'Sent a file',
      is_read: false,
      created_at: new Date().toISOString(),
      file_url: uri,
      file_name: fileName,
      file_type: mimeType,
      _status: 'sending',
    };
    setMessages((prev) => [...prev, optimistic]);

    const result = await handleSendFile(selectedId, currentUserId, uri, fileName, mimeType, fileSize);
    if (result.success) {
      setMessages((prev) =>
        prev.map((m) => m.id === tempId ? { ...result.data, _status: 'sent' } : m)
      );
      setConversations((prev) =>
        prev
          .map((c) =>
            c.id === selectedId
              ? { ...c, last_message: result.data.content, last_message_at: result.data.created_at, last_message_sender_id: currentUserId, last_message_is_read: false }
              : c
          )
          .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
      );
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast({ title: result.error, preset: 'error' });
    }
  }, [selectedId, currentUserId]);

  // Realtime: new messages + read receipts
  useEffect(() => {
    if (!currentUserId) return;

    const channel = subscribeToMessages(
      (payload) => {
        const msg = payload.new as Message;
        const selId = selectedIdRef.current;
        const uid = currentUserIdRef.current;

        if (msg.sender_id === uid && msg.conversation_id === selId) return;

        if (msg.conversation_id === selId) {
          setMessages((prev) => [...prev, msg]);
          setOtherTyping(false);
          if (typingTimeoutRef.current) { clearTimeout(typingTimeoutRef.current); typingTimeoutRef.current = null; }
          if (isChatActiveRef.current) markAsRead(selId!, uid);
        }

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
                    last_message_sender_id: msg.sender_id ?? undefined,
                    last_message_is_read: msg.conversation_id === selId,
                  }
                : c
            )
            .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
        );
      },
      (payload) => {
        const updated = payload.new as Message;
        const uid = currentUserIdRef.current;

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

  // Typing: selected conversation
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

  // Typing: all conversations
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
    if (now - lastTypingBroadcast.current < 2000) return;
    lastTypingBroadcast.current = now;
    broadcastTyping(selectedId, currentUserId);
  }, [selectedId, currentUserId]);

  // Derived: other user info
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

  // Last seen
  useEffect(() => {
    if (!otherUserId) { setOtherLastSeen(null); return; }
    if (otherIsOnline) { setOtherLastSeen(null); return; }
    getLastSeen(otherUserId).then(setOtherLastSeen);
  }, [otherUserId, otherIsOnline]);

  return {
    conversations,
    selectedId,
    setSelectedId,
    messages,
    currentUserId,
    loading,
    messagesLoading,
    hasMore,
    loadingMore,
    otherTyping,
    typingConvos,
    otherLastSeen,
    otherUser,
    otherIsOnline,
    onSend,
    onSendFile,
    handleLoadMore,
    handleTyping,
  };
}
