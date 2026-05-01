import { View, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

type Props = {
  completedErrands: number;
  postedCompleted: number;
  rating: number | null;
  contentWidth?: number;
  isLarge?: boolean;
};

export default function ErrandActivityCard({ completedErrands, postedCompleted, rating, contentWidth, isLarge }: Props) {
  return (
    <View style={{ width: contentWidth, alignSelf: isLarge ? 'center' : undefined, marginHorizontal: isLarge ? 0 : 16, backgroundColor: '#fff', borderRadius: 24, padding: 24, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Errand Activity</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827' }}>{completedErrands}</Text>
          <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, textAlign: 'center' }}>Errands Completed</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827' }}>{postedCompleted}</Text>
          <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, textAlign: 'center' }}>Posts Completed</Text>
        </View>
      </View>
      <View style={{ marginTop: 16, backgroundColor: '#FFFBEB', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#92400E' }}>Errand Completion Rating</Text>
          <Text style={{ fontSize: 11, color: '#B45309', marginTop: 2 }}>Based on completed errands</Text>
        </View>
        {rating != null ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <FontAwesome name="star" size={18} color="#FEA405" />
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#111827' }}>{rating.toFixed(1)}</Text>
          </View>
        ) : (
          <Text style={{ fontSize: 13, color: '#9CA3AF' }}>No ratings yet</Text>
        )}
      </View>
    </View>
  );
}
