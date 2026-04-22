import { View, Text } from 'react-native';

interface Props {
  title?: string;
  description?: string;
  budget?: number;
}

export default function ErrandInfoCard({ title, description, budget }: Props) {
  return (
    <View style={{ width: '100%', maxWidth: 320 }}>
      <View style={{ backgroundColor: '#FFFBEB', borderRadius: 12, borderWidth: 1, borderColor: '#FDE68A', padding: 12, marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 }} numberOfLines={1}>{title}</Text>
          {budget != null && (
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#D97706' }}>₱{budget.toLocaleString()}</Text>
          )}
        </View>
        {description ? (
          <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 17, marginTop: 4 }} numberOfLines={2}>{description}</Text>
        ) : null}
      </View>
    </View>
  );
}
