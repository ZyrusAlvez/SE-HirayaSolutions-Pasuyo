import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

interface Props {
  title?: string;
  description?: string;
  budget?: number;
  onMarkDone?: () => void;
  onCancel?: () => void;
  onMoreInfo?: () => void;
}

export default function ErrandInfoCard({ title, description, budget, onMarkDone, onCancel, onMoreInfo }: Props) {
  const [hover, setHover] = useState(false);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', borderBottomWidth: 1, borderBottomColor: '#FDE68A', paddingHorizontal: 16, paddingVertical: 12 }}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', flexShrink: 1 }} numberOfLines={1}>{title}</Text>
          {budget != null && (
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#D97706' }}>₱{budget.toLocaleString()}</Text>
          )}
        </View>
        {description ? (
          <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 17, marginTop: 2 }} numberOfLines={1}>{description}</Text>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
        {onMoreInfo && (
          <Pressable
            onPress={onMoreInfo}
            // @ts-ignore — web-only hover props
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{ position: 'relative', padding: 4 }}
          >
            <Ionicons name="information-circle-outline" size={20} color="#9CA3AF" />
            {hover && (
              <View style={{ position: 'absolute', bottom: 32, right: 0, backgroundColor: '#1F2937', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 10, whiteSpace: 'nowrap' } as any}>More info</Text>
              </View>
            )}
          </Pressable>
        )}
        {onCancel && (
          <TouchableOpacity
            onPress={onCancel}
            activeOpacity={0.8}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' }}
          >
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B7280' }}>Cancel</Text>
          </TouchableOpacity>
        )}
        {onMarkDone && (
          <TouchableOpacity
            onPress={onMarkDone}
            activeOpacity={0.8}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FEA405' }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>Mark as Done</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
