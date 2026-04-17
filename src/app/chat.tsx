import { View } from 'react-native';
import { useProfile } from '@/context/ProfileContext';
import Header from '@/view/components/Header';
import NavBar from '@/view/components/NavBar';
import ConversationList from '@/view/presentation/chat/ConversationList';
import ChatThread from '@/view/presentation/chat/ChatThread';

export default function ChatScreen() {
  const { avatarUrl, verificationStatus } = useProfile();

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <Header avatarUrl={avatarUrl} verificationStatus={verificationStatus} />
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <ConversationList />
        <ChatThread />
      </View>
      <NavBar />
    </View>
  );
}
