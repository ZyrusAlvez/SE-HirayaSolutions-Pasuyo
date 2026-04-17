import { View, Text } from 'react-native';

export default function ChatThread() {
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#9CA3AF', fontSize: 14 }}>Select a conversation to start chatting</Text>
      </View>
    </View>
  );
}
