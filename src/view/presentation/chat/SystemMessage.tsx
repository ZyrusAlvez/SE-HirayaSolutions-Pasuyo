import { View, Text } from 'react-native';
import RateErrandCard from '@/view/presentation/chat/RateErrandCard';

interface Props {
  content: string;
  currentUserId?: string;
}

export default function SystemMessage({ content, currentUserId }: Props) {
  let label = content;
  let rateCard: React.ReactNode = null;

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
      if (!isMe && currentUserId && parsed.errandId && parsed.markedBy) {
        rateCard = (
          <RateErrandCard
            errandId={parsed.errandId}
            reviewedId={parsed.markedBy}
            workerName={parsed.markedByName ?? 'the runner'}
            currentUserId={currentUserId}
          />
        );
      }
    } else if (parsed?.type === 'errand_reviewed') {
      const isMe = parsed.reviewerId === currentUserId;
      const title = parsed.title ? ` for "${parsed.title}"` : '';
      const stars = '★'.repeat(parsed.rating ?? 0) + '☆'.repeat(5 - (parsed.rating ?? 0));
      label = isMe
        ? `You left a review${title}  ${stars}`
        : `You received a review${title}  ${stars}`;
      if (parsed.feedback) {
        label += `\n"${parsed.feedback}"`;
      }
    }
  } catch {}

  return (
    <View style={{ marginVertical: 16 }}>
      <View style={{ height: 1, backgroundColor: '#E5E7EB' }} />
      <Text style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', paddingVertical: 8, lineHeight: 16, fontStyle: 'italic' }}>{label}</Text>
      {rateCard}
      <View style={{ height: 1, backgroundColor: '#E5E7EB' }} />
    </View>
  );
}
