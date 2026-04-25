import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RateErrandCard from '@/view/presentation/chat/RateErrandCard';

interface Props {
  content: string;
  currentUserId?: string;
}

function ReviewCard({ rating, title, feedback, isMe }: { rating: number; title?: string; feedback?: string | null; isMe: boolean }) {
  return (
    <View style={{ marginVertical: 12, alignItems: 'center' }}>
      <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, width: '85%', maxWidth: 320, alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>
          {isMe ? 'You left a review' : 'You received a review'}
        </Text>
        {title ? (
          <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 8 }} numberOfLines={1}>
            for "{title}"
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Ionicons key={i} name={i <= rating ? 'star' : 'star-outline'} size={24} color={i <= rating ? '#FEA405' : '#D1D5DB'} />
          ))}
        </View>
        {feedback ? (
          <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 8, fontStyle: 'italic', textAlign: 'center', lineHeight: 18 }}>
            "{feedback}"
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function SystemMessage({ content, currentUserId }: Props) {
  let label = content;
  let card: React.ReactNode = null;

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
        card = (
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
      label = '';
      card = <ReviewCard rating={parsed.rating ?? 0} title={parsed.title} feedback={parsed.feedback} isMe={isMe} />;
    }
  } catch {}

  return (
    <View style={{ marginVertical: 16 }}>
      <View style={{ height: 1, backgroundColor: '#E5E7EB' }} />
      {label ? (
        <Text style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', paddingVertical: 8, lineHeight: 16, fontStyle: 'italic' }}>{label}</Text>
      ) : null}
      {card}
      <View style={{ height: 1, backgroundColor: '#E5E7EB' }} />
    </View>
  );
}
