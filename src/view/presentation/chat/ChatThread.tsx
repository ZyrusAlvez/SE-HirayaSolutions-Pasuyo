import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, FlatList, Image, Pressable, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Message, MessageStatus } from '@/controllers/chatController';
import ImageViewer from '@/view/components/ImageViewer';
import SystemMessage from '@/view/presentation/chat/SystemMessage';
import ErrandInfoCard from '@/view/presentation/chat/ErrandInfoCard';
import ChatSkeleton from '@/view/presentation/chat/ChatSkeleton';
import FileBubble from '@/view/presentation/chat/FileBubble';
import CancelErrandModal from '@/view/presentation/chat/CancelErrandModal';
import MarkDoneModal from '@/view/presentation/chat/MarkDoneModal';
import { toast } from '@/utils/toast';
import ReportModal from '@/view/presentation/user/ReportModal';

const DEFAULT_AVATAR = require('@/assets/images/default_profile.jpg');

const getAvatarSource = (avatar: string | null | undefined) =>
  avatar && avatar !== 'null' && avatar !== 'default' && avatar.trim() ? { uri: avatar } : DEFAULT_AVATAR;

type Props = {
  messages: Message[];
  currentUserId: string;
  otherUserId?: string | null;
  otherUser: { name: string; avatar: string | null } | null;
  loading: boolean;
  selected: boolean;
  onSend: (content: string) => void;
  onSendFile?: (uri: string, fileName: string, mimeType: string, fileSize?: number) => void;
  onCancelErrand?: (errandId: string, title: string, reason: string, details: string | null) => Promise<boolean>;
  onMarkDone?: (errandId: string, title: string) => Promise<boolean>;
  onBack?: () => void;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
  otherTyping?: boolean;
  onTyping?: () => void;
  otherIsOnline?: boolean;
  otherLastSeen?: string | null;
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

function formatLastSeen(dateStr: string | null | undefined) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Active just now';
  if (mins < 60) return `Active ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Active ${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `Active ${days}d ago`;
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

function MessageBubble({ item, isMe, otherAvatar, isLastOwn, onImagePress }: { item: Message; isMe: boolean; otherAvatar?: string | null; isLastOwn: boolean; onImagePress?: () => void }) {
  const [revealed, setRevealed] = useState(false);
  const hasFile = !!item.file_url;

  return (
    <Pressable
      onPress={() => setRevealed((v) => !v)}
      style={{ alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: 4 }}
    >
      {hasFile ? (
        <FileBubble item={item} isMe={isMe} onImagePress={onImagePress} />
      ) : (
        <View style={{
          maxWidth: '70%',
          backgroundColor: isMe ? '#3B82F6' : '#F3F4F6',
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}>
          <Text style={{ color: isMe ? '#FFFFFF' : '#111827', fontSize: 14 }}>{item.content}</Text>
        </View>
      )}
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

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: false }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: false }),
        ])
      );
    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 150);
    const a3 = animate(dot3, 300);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  const dotStyle = (anim: Animated.Value) => ({
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 2,
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) }],
  });

  return (
    <View style={{ alignItems: 'flex-start', marginBottom: 4 }}>
      <View style={{ backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }}>
        <Animated.View style={dotStyle(dot1)} />
        <Animated.View style={dotStyle(dot2)} />
        <Animated.View style={dotStyle(dot3)} />
      </View>
    </View>
  );
}

export default function ChatThread({ messages, currentUserId, otherUserId, otherUser, loading, selected, onSend, onSendFile, onCancelErrand, onMarkDone, onBack, onLoadMore, loadingMore, hasMore, otherTyping, onTyping, otherIsOnline, otherLastSeen }: Props) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [attachHover, setAttachHover] = useState(false);
  const [reportHover, setReportHover] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [errandsExpanded, setErrandsExpanded] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<{ errandId: string; title: string; posterId?: string } | null>(null);
  const [doneTarget, setDoneTarget] = useState<{ errandId: string; title: string; description?: string; budget?: number } | null>(null);

  const imageMessages = messages.filter((m) => m.file_url && m.file_type?.startsWith('image/'));
  const imageItems = imageMessages.map((m) => ({ uri: m.file_url!, fileName: m.file_name ?? undefined }));

  const parsedMessages = messages.map((m) => {
    try { return { ...JSON.parse(m.content), _created: m.created_at }; } catch { return null; }
  }).filter(Boolean);

  const lastAcceptTime: Record<string, string> = {};
  for (const p of parsedMessages) {
    if (p.type === 'errand_accepted' && p.acceptedBy === currentUserId) {
      lastAcceptTime[p.errandId] = p._created;
    }
  }

  const cancelledErrandIds = new Set(
    parsedMessages
      .filter((p) => p.type === 'errand_cancelled' && (!lastAcceptTime[p.errandId] || p._created > lastAcceptTime[p.errandId]))
      .map((p) => p.errandId)
  );

  const doneErrandIds = new Set(
    parsedMessages
      .filter((p) => p.type === 'errand_marked_done')
      .map((p) => p.errandId)
  );

  const pinnedErrandsMap = new Map<string, any>();
  for (const p of parsedMessages) {
    if (p.type === 'errand_accepted' && p.acceptedBy === currentUserId && !cancelledErrandIds.has(p.errandId) && !doneErrandIds.has(p.errandId)) {
      pinnedErrandsMap.set(p.errandId, p);
    }
  }
  const pinnedErrands = [...pinnedErrandsMap.values()].reverse();
  const hasMoreErrands = pinnedErrands.length > 1;

  const pickAttachment = async () => {
    try {
      const DocumentPicker = await import('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setUploading(true);
      onSendFile?.(asset.uri, asset.name, asset.mimeType || 'application/octet-stream', asset.size);
      setUploading(false);
    } catch {}
  };

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
        <Pressable onPress={() => otherUserId && router.push(`/user/${otherUserId}`)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ position: 'relative' }}>
            <Image
              source={getAvatarSource(otherUser?.avatar)}
              style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }}
            />
            {otherIsOnline ? (
              <View style={{ position: 'absolute', bottom: 0, right: 8, width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#FFFFFF' }} />
            ) : (
              <View style={{ position: 'absolute', bottom: 0, right: 8, width: 10, height: 10, borderRadius: 5, backgroundColor: '#9CA3AF', borderWidth: 2, borderColor: '#FFFFFF' }} />
            )}
          </View>
          <View>
            <Text style={{ fontWeight: '700', fontSize: 16, color: '#111827' }}>{otherUser?.name ?? 'Unknown'}</Text>
            <Text style={{ fontSize: 11, color: otherIsOnline ? '#22C55E' : '#9CA3AF', marginTop: 1 }}>
              {otherIsOnline ? 'Active now' : formatLastSeen(otherLastSeen)}
            </Text>
          </View>
        </Pressable>
        <View style={{ position: 'relative' }}>
          <Pressable
            onPress={() => setReportVisible(true)}
            // @ts-ignore — web-only hover props
            onMouseEnter={() => setReportHover(true)}
            onMouseLeave={() => setReportHover(false)}
            style={{ padding: 6 }}
          >
            <Ionicons name="flag-outline" size={22} color="#EF4444" />
          </Pressable>
          {reportHover && (
            <View style={{ position: 'absolute', bottom: -32, right: 0, backgroundColor: '#1F2937', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 11, whiteSpace: 'nowrap' } as any}>Report {otherUser?.name ?? 'user'}</Text>
            </View>
          )}
        </View>
      </View>
      <ReportModal visible={reportVisible} userName={otherUser?.name} reportedId={otherUserId ?? undefined} onClose={() => setReportVisible(false)} />
      {pinnedErrands.length > 0 && (
        <Pressable
          onPress={() => hasMoreErrands && setErrandsExpanded((v) => !v)}
          disabled={!hasMoreErrands}
          style={{ zIndex: 10, elevation: 10 }}
        >
          {errandsExpanded ? (
            <View>
              {pinnedErrands.map((errand: any, i: number) => (
                <ErrandInfoCard
                  key={errand.errandId ?? i}
                  title={errand.title}
                  description={errand.description}
                  budget={errand.budget}
                  onMoreInfo={() => errand.errandId && router.push(`/errand/${errand.errandId}`)}
                  onMarkDone={() => setDoneTarget({ errandId: errand.errandId, title: errand.title, description: errand.description, budget: errand.budget })}
                  onCancel={() => setCancelTarget({ errandId: errand.errandId, title: errand.title, posterId: errand.posterId })}
                />
              ))}
              <Pressable
                onPress={() => setErrandsExpanded(false)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6, backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 4 }}
              >
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B7280' }}>Show less</Text>
                <Ionicons name="chevron-up" size={12} color="#6B7280" />
              </Pressable>
            </View>
          ) : (
            <View style={{ position: 'relative', zIndex: 10, marginBottom: pinnedErrands.length >= 3 ? 6 : pinnedErrands.length >= 2 ? 3 : 0 }}>
              {pinnedErrands.length >= 3 && (
                <View style={{ position: 'absolute', top: 6, left: 6, right: 6, bottom: -6, backgroundColor: '#FEF3C7', borderBottomWidth: 1, borderBottomColor: '#FDE68A', opacity: 0.5 }} />
              )}
              {pinnedErrands.length >= 2 && (
                <View style={{ position: 'absolute', top: 3, left: 3, right: 3, bottom: -3, backgroundColor: '#FEF9C3', borderBottomWidth: 1, borderBottomColor: '#FDE68A', opacity: 0.7 }} />
              )}
              <ErrandInfoCard
                title={pinnedErrands[0].title}
                description={pinnedErrands[0].description}
                budget={pinnedErrands[0].budget}
                onMoreInfo={() => pinnedErrands[0].errandId && router.push(`/errand/${pinnedErrands[0].errandId}`)}
                onMarkDone={() => setDoneTarget({ errandId: pinnedErrands[0].errandId, title: pinnedErrands[0].title, description: pinnedErrands[0].description, budget: pinnedErrands[0].budget })}
                onCancel={() => setCancelTarget({ errandId: pinnedErrands[0].errandId, title: pinnedErrands[0].title, posterId: pinnedErrands[0].posterId })}
              />
            </View>
          )}
        </Pressable>
      )}
      <CancelErrandModal
        visible={!!cancelTarget}
        errandTitle={cancelTarget?.title}
        onClose={() => setCancelTarget(null)}
        onConfirm={async (reason, details) => {
          if (!cancelTarget?.errandId) return;
          const success = await onCancelErrand?.(cancelTarget.errandId, cancelTarget.title, reason, details);
          if (success) {
            toast({ title: 'Errand cancelled', preset: 'done' });
          } else {
            toast({ title: 'Failed to cancel errand', preset: 'error' });
          }
          setCancelTarget(null);
        }}
      />
      <MarkDoneModal
        visible={!!doneTarget}
        errandTitle={doneTarget?.title}
        description={doneTarget?.description}
        budget={doneTarget?.budget}
        onClose={() => setDoneTarget(null)}
        onConfirm={async () => {
          if (!doneTarget?.errandId) return;
          const success = await onMarkDone?.(doneTarget.errandId, doneTarget.title);
          if (success) {
            toast({ title: 'Errand marked as done', preset: 'done' });
          } else {
            toast({ title: 'Failed to mark errand as done', preset: 'error' });
          }
          setDoneTarget(null);
        }}
      />
      {loading ? (
        <ChatSkeleton />
      ) : messages.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#9CA3AF', fontSize: 14 }}>No messages yet. Say hello!</Text>
        </View>
      ) : (
        <FlatList
          style={{ zIndex: 1 }}
          data={[...messages].reverse()}
          inverted
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16 }}
          onEndReached={hasMore ? onLoadMore : undefined}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={otherTyping ? <TypingIndicator /> : null}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 12 }} color="#6B7280" /> : null}
          renderItem={({ item, index }) => {
            const actualIndex = messages.length - 1 - index;
            const prev = actualIndex > 0 ? messages[actualIndex - 1] : undefined;
            const showSeparator = shouldShowTimeSeparator(item, prev);

            const isSystemMsg = (() => { try { const t = JSON.parse(item.content)?.type; return t === 'errand_accepted' || t === 'errand_cancelled' || t === 'errand_marked_done' || t === 'errand_reviewed'; } catch { return false; } })();

            if (isSystemMsg) {
              return (
                <>
                  <SystemMessage content={item.content} currentUserId={currentUserId} />
                  {showSeparator && (
                    <Text style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF', marginVertical: 12 }}>
                      {formatSeparatorTime(item.created_at)}
                    </Text>
                  )}
                </>
              );
            }

            const isMe = item.sender_id === currentUserId;
            return (
              <>
                <MessageBubble
                  item={item}
                  isMe={isMe}
                  otherAvatar={otherUser?.avatar}
                  isLastOwn={isMe && item.id === lastOwnMsgId}
                  onImagePress={item.file_url && item.file_type?.startsWith('image/')
                    ? () => setViewerIndex(imageMessages.findIndex((m) => m.id === item.id))
                    : undefined}
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
      <ImageViewer images={imageItems} activeIndex={viewerIndex} onClose={() => setViewerIndex(null)} onIndexChange={setViewerIndex} />
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
        <View style={{ position: 'relative' }}>
          <Pressable
            onPress={pickAttachment}
            // @ts-ignore — web-only hover props
            onMouseEnter={() => setAttachHover(true)}
            onMouseLeave={() => setAttachHover(false)}
            style={{ marginRight: 8, padding: 6 }}
            disabled={uploading}
          >
            <Ionicons name="attach-outline" size={22} color={uploading ? '#D1D5DB' : '#6B7280'} />
          </Pressable>
          {attachHover && (
            <View style={{ position: 'absolute', bottom: 40, left: -4, backgroundColor: '#1F2937', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 11, whiteSpace: 'nowrap' } as any}>Max 5MB</Text>
            </View>
          )}
        </View>
        <TextInput
          value={input}
          onChangeText={(text) => { setInput(text); onTyping?.(); }}
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
            outlineStyle: 'none' as any,
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
