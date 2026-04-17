import { View, Text } from 'react-native';

export default function ConversationList() {
  return (
    <View style={{ width: 320, borderRightWidth: 1, borderRightColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
      <Text style={{ padding: 16, fontWeight: '700', fontSize: 18, color: '#111827' }}>Messages</Text>
    </View>
  );
}
