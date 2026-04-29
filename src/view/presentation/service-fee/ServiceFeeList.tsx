import { View, Text, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import type { ServiceFeeErrand } from '@/controllers/serviceFeeController';

const DEFAULT_AVATAR = require('@/assets/images/default_profile.jpg');

function FeeCard({ errand }: { errand: ServiceFeeErrand }) {
  const router = useRouter();
  const avatar = errand.poster_avatar && errand.poster_avatar !== 'default'
    ? { uri: errand.poster_avatar }
    : DEFAULT_AVATAR;
  const date = new Date(errand.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/errand/${errand.id}`)}
      style={{
        backgroundColor: 'white', borderRadius: 14, padding: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
      }}
    >
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
    </TouchableOpacity>
  );
}

interface Props {
  errands: ServiceFeeErrand[];
  emptyText: string;
}

export default function ServiceFeeList({ errands, emptyText }: Props) {
  if (errands.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 64 }}>
        <Ionicons name="document-text-outline" size={48} color="#E5E7EB" />
        <Text style={{ color: '#9CA3AF', marginTop: 8 }}>{emptyText}</Text>
      </View>
    );
  }

  const totalFees = errands.reduce((sum, e) => sum + e.serviceFee, 0);

  return (
    <ScrollView showsVerticalScrollIndicator contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
      <View style={{
        backgroundColor: '#FFFBEB', borderRadius: 12, padding: 14, marginBottom: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#92400E' }}>Total Service Fees</Text>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#D97706' }}>₱{totalFees.toLocaleString()}</Text>
      </View>
      <View style={{ gap: 12 }}>
        {errands.map((e) => <FeeCard key={e.id} errand={e} />)}
      </View>
    </ScrollView>
  );
}
