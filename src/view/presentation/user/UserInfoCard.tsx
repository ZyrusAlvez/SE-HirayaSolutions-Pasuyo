import { View, Text } from 'react-native';
import type { UserProfile } from '@/models/profileModel';

type Props = {
  profile: UserProfile;
  contentWidth?: number;
  isLarge?: boolean;
};

export default function UserInfoCard({ profile, contentWidth, isLarge }: Props) {
  const address = [profile.address_barangay, profile.address_city, profile.address_province].filter(Boolean).join(', ');

  const rows: { label: string; value: string }[] = [
    { label: 'Name', value: profile.name || '—' },
    { label: 'Email', value: profile.email || '—' },
    ...(profile.verified ? [
      { label: 'Gender', value: profile.gender ?? '—' },
      { label: 'Date of Birth', value: profile.date_of_birth ?? '—' },
      { label: 'Address', value: address || '—' },
    ] : []),
  ];

  return (
    <View style={{ width: contentWidth, alignSelf: isLarge ? 'center' : undefined, marginHorizontal: isLarge ? 0 : 16, backgroundColor: '#fff', borderRadius: 24, padding: 24, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Personal Information</Text>
      {rows.map(({ label, value }) => (
        <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
          <Text style={{ fontSize: 14, color: '#9CA3AF' }}>{label}</Text>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', flexShrink: 0, marginLeft: 16, textAlign: 'right' }} numberOfLines={2}>{value}</Text>
        </View>
      ))}
    </View>
  );
}
