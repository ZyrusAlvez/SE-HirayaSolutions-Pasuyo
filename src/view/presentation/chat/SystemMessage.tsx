import { View, Text } from 'react-native';

interface Props {
  content: string;
  currentUserId?: string;
}

export default function SystemMessage({ content, currentUserId }: Props) {
  let label = content;
  try {
    const parsed = JSON.parse(content);
    if (parsed?.type === 'errand_accepted') {
      const title = parsed.title ?? 'an errand';
      const isMe = parsed.acceptedBy === currentUserId;
      const name = isMe ? 'you' : (parsed.acceptedByName ?? 'someone');
      label = `The errand "${title}" has been accepted by ${name}`;
    } else if (parsed?.type === 'errand_cancelled') {
      const title = parsed.title ?? 'an errand';
      const isMe = parsed.cancelledBy === currentUserId;
      label = isMe
        ? `You cancelled the errand "${title}"`
        : `The errand "${title}" has been cancelled by the runner`;
    } else if (parsed?.type === 'errand_marked_done') {
      const title = parsed.title ?? 'an errand';
      const isMe = parsed.markedBy === currentUserId;
      label = isMe
        ? `You marked the errand "${title}" as done`
        : `The errand "${title}" has been marked as done by ${parsed.markedByName ?? 'the runner'}`;
    }
  } catch {}

  return (
    <View style={{ marginVertical: 16 }}>
      <View style={{ height: 1, backgroundColor: '#E5E7EB' }} />
      <Text style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', paddingVertical: 8, lineHeight: 16, fontStyle: 'italic' }}>{label}</Text>
      <View style={{ height: 1, backgroundColor: '#E5E7EB' }} />
    </View>
  );
}
