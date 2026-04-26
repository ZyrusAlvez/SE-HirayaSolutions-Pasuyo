import { View, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { VerificationStatus, ProfileData } from '@/models/profileModel';

type Props = {
  contentWidth: number | undefined;
  isLarge: boolean;
  verificationStatus: VerificationStatus;
  profileInfo: ProfileData | null;
  displayName: string;
  email: string;
  onNameChange: (name: string) => void;
};

export default function ProfileInfoCard({
  contentWidth, isLarge, verificationStatus, profileInfo,
  displayName, email, onNameChange,
}: Props) {
  const isVerified = verificationStatus === 'verified' && profileInfo;

  const infoRows: { label: string; value: string }[] = [
    { label: 'Name', value: displayName || '—' },
    { label: 'Email', value: email || '—' },
    ...(isVerified ? [
      { label: 'Gender', value: profileInfo.gender ?? '—' },
      { label: 'Date of Birth', value: profileInfo.date_of_birth ?? '—' },
      { label: 'Address', value: [profileInfo.address_barangay, profileInfo.address_city, profileInfo.address_province].filter(Boolean).join(', ') || '—' },
    ] : []),
  ];

  return (
    <View style={{ width: contentWidth, alignSelf: isLarge ? 'center' : undefined, marginHorizontal: isLarge ? 0 : 16, backgroundColor: '#fff', borderRadius: 24, padding: 24, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Personal Information</Text>

      {isVerified ? (
        infoRows.map(({ label, value }) => (
          <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
            <Text style={{ fontSize: 14, color: '#9CA3AF' }}>{label}</Text>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', flexShrink: 0, marginLeft: 16, textAlign: 'right' }} numberOfLines={2}>{value}</Text>
          </View>
        ))
      ) : (
        <>
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4, marginLeft: 4 }}>Display Name</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 16 }}>
              <Ionicons name="person-outline" size={18} color="#9CA3AF" />
              <TextInput
                style={{ flex: 1, paddingVertical: 14, marginLeft: 8, fontSize: 16, color: '#111827' }}
                placeholder="Enter your display name"
                placeholderTextColor="#9CA3AF"
                value={displayName}
                onChangeText={onNameChange}
                autoCapitalize="words"
              />
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
            <Text style={{ fontSize: 14, color: '#9CA3AF' }}>Email</Text>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>{email || '—'}</Text>
          </View>
        </>
      )}
    </View>
  );
}
