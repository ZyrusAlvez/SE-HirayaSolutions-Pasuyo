import { View, Text, ScrollView, Image, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import type { ServiceFeeErrand } from '@/controllers/serviceFeeController';
import ServiceFeeInfo from './ServiceFeeInfo';

const DEFAULT_AVATAR = require('@/assets/images/default_profile.jpg');

function FeeCard({ errand }: { errand: ServiceFeeErrand }) {
  const router = useRouter();
  const avatar = errand.poster_avatar && errand.poster_avatar !== 'default'
    ? { uri: errand.poster_avatar }
    : DEFAULT_AVATAR;
  const date = new Date(errand.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <View style={{
      backgroundColor: 'white', borderRadius: 14, padding: 14,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Image source={avatar} style={{ width: 20, height: 20, borderRadius: 10 }} />
        <Text style={{ fontSize: 11, fontWeight: '500', color: '#6B7280', flex: 1 }} numberOfLines={1}>{errand.poster_name ?? 'Unknown'}</Text>
        <Text style={{ fontSize: 10, color: '#9CA3AF' }}>{date}</Text>
      </View>

      <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 }} numberOfLines={1}>{errand.title}</Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
        <View>
          <Text style={{ fontSize: 10, color: '#9CA3AF' }}>Budget</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>₱{errand.budget.toLocaleString()}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 10, color: '#9CA3AF' }}>Service Fee (10%)</Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#D97706' }}>₱{errand.serviceFee.toLocaleString()}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push(`/errand/${errand.id}`)}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6' }}
        >
          <Ionicons name="open-outline" size={14} color="#374151" />
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151' }}>More Info</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' }}
        >
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280' }}>History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface Props {
  errands: ServiceFeeErrand[];
  emptyText: string;
}

export default function ServiceFeeList({ errands, emptyText }: Props) {
  const { width } = useWindowDimensions();
  const columns = width >= 1024 ? 3 : width >= 768 ? 2 : 1;
  const totalFees = errands.reduce((sum, e) => sum + e.serviceFee, 0);

  return (
    <ScrollView showsVerticalScrollIndicator contentContainerStyle={{ padding: 20, paddingBottom: 32, maxWidth: 960, width: '100%', alignSelf: 'center' as const }}>
      <ServiceFeeInfo />

      <View style={{
        backgroundColor: '#FFFBEB', borderRadius: 12, padding: 14, marginBottom: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#92400E' }}>Total Unpaid Fees</Text>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#D97706' }}>₱{totalFees.toLocaleString()}</Text>
      </View>

      {errands.length === 0 ? (
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 64 }}>
          <Ionicons name="document-text-outline" size={48} color="#E5E7EB" />
          <Text style={{ color: '#9CA3AF', marginTop: 8 }}>{emptyText}</Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {errands.map((e) => (
            <View key={e.id} style={{ width: columns === 1 ? '100%' : `${Math.floor(100 / columns) - 1}%` as any }}>
              <FeeCard errand={e} />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
