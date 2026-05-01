import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { submitErrandReview } from '@/controllers/errandController';
import { getErrandReview } from '@/models/errandModel';
import { toast } from '@/utils/toast';

interface Props {
  errandId: string;
  reviewedId: string;
  workerName: string;
  currentUserId: string;
}

function Stars({ rating, onSelect }: { rating: number; onSelect?: (r: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity key={i} onPress={() => onSelect?.(i)} disabled={!onSelect} activeOpacity={0.7}>
          <Ionicons name={i <= rating ? 'star' : 'star-outline'} size={24} color={i <= rating ? '#FEA405' : '#D1D5DB'} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function RateErrandCard({ errandId, reviewedId, workerName, currentUserId }: Props) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ rating: number; feedback?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getErrandReview(errandId, currentUserId).then(({ data }) => {
      if (data) setSubmitted(data);
      setLoading(false);
    });
  }, [errandId, currentUserId]);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    const result = await submitErrandReview(errandId, reviewedId, rating, feedback.trim() || null);
    if (result.success) {
      setSubmitted({ rating, feedback: feedback.trim() || null });
      toast({ title: 'Review submitted', preset: 'done' });
    } else {
      toast({ title: result.error, preset: 'error' });
    }
    setSubmitting(false);
  };

  if (loading) return null;

  if (submitted) {
    return (
      <View style={{ marginVertical: 12, alignItems: 'center' }}>
        <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, width: '85%', maxWidth: 320, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>You rated {workerName}</Text>
          <Stars rating={submitted.rating} />
          {submitted.feedback ? (
            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 8, fontStyle: 'italic', textAlign: 'center' }}>"{submitted.feedback}"</Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={{ marginVertical: 12, alignItems: 'center' }}>
      <View style={{ backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 12, padding: 16, width: '85%', maxWidth: 320, alignItems: 'center' }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 10 }}>Rate {workerName}'s work</Text>
        <Stars rating={rating} onSelect={setRating} />
        {rating > 0 && (
          <View style={{ width: '100%', marginTop: 12 }}>
            <TextInput
              value={feedback}
              onChangeText={setFeedback}
              placeholder="Leave a comment (optional)"
              placeholderTextColor="#9CA3AF"
              multiline
              style={{
                borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
                padding: 10, fontSize: 12, color: '#111827',
                minHeight: 48, textAlignVertical: 'top', backgroundColor: '#FFFFFF',
              }}
            />
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
              style={{ marginTop: 10, backgroundColor: '#FEA405', borderRadius: 8, paddingVertical: 10, alignItems: 'center', opacity: submitting ? 0.6 : 1 }}
            >
              {submitting
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>Submit Review</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
