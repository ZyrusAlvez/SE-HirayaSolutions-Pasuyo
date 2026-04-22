import { View, Platform, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useProfile } from '@/context/ProfileContext';
import { useChat } from '@/hooks/useChat';
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

  const {
    conversations, selectedId, setSelectedId, messages, currentUserId,
    loading, messagesLoading, hasMore, loadingMore,
    otherTyping, typingConvos, otherLastSeen, otherUser, otherIsOnline,
    onSend, onSendFile, handleLoadMore, handleTyping,
  } = useChat(targetUserId);

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
