import { View, Text, Image } from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';

const ACCENT = '#FEA405';
const DEFAULT_AVATAR = require('../../assets/images/default_profile.jpg');

interface Props {
  name?: string;
  avatar?: string;
  rating?: number;
  isVerified?: boolean;
  postedOn: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <FontAwesome key={i} name={i <= Math.round(rating) ? 'star' : 'star-o'} size={12} color={ACCENT} />
      ))}
      <Text style={{ fontSize: 11, color: '#6B7280', marginLeft: 4 }}>{rating.toFixed(1)}</Text>
    </View>
  );
}

export default function ErrandPosterCard({ name, avatar, rating, isVerified, postedOn }: Props) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: 'white', borderRadius: 14, padding: 14,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    }}>
      <Image
        source={avatar && avatar !== 'default' ? { uri: avatar } : DEFAULT_AVATAR}
        style={{ width: 42, height: 42, borderRadius: 21 }}
      />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>
            {name ?? 'Anonymous'}
          </Text>
          {isVerified && <MaterialIcons name="verified" size={14} color="#1D9BF0" />}
        </View>
        {rating != null && rating > 0 && <StarRating rating={rating} />}
        <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Posted {postedOn}</Text>
      </View>
    </View>
  );
}
