import { View, Text, TextInput, TouchableOpacity } from 'react-native';
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
  onChangePassword: () => void;
  onVerify: () => void;
};

export default function ProfileInfoCard({
  contentWidth, isLarge, verificationStatus, profileInfo,
  displayName, email, onNameChange, onChangePassword, onVerify,
}: Props) {
  return (
    <View style={{ width: contentWidth, alignSelf: isLarge ? 'center' : undefined, marginHorizontal: isLarge ? 0 : 16, backgroundColor: '#fff', borderRadius: 24, padding: 24, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
      <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Account Info</Text>

      {verificationStatus === 'verified' && profileInfo ? (
        <View className="mb-4 gap-3">
          {([
            { label: 'Name', value: displayName },
            { label: 'Gender', value: profileInfo.gender },
            { label: 'Date of Birth', value: profileInfo.date_of_birth },
            { label: 'Address', value: [profileInfo.address_barangay, profileInfo.address_city, profileInfo.address_province].filter(Boolean).join(', ') },
          ] as { label: string; value?: string }[]).map(({ label, value }) => (
            <View key={label} className="flex-row justify-between py-2 border-b border-gray-100">
              <Text className="text-sm text-gray-400">{label}</Text>
              <Text className="text-sm font-medium text-gray-700 flex-shrink-0 ml-4 text-right" numberOfLines={2}>{value || '—'}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View className="mb-4">
          <Text className="text-xs text-gray-500 mb-1 ml-1">Display Name</Text>
          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4">
            <Ionicons name="person-outline" size={18} color="#9CA3AF" />
            <TextInput
              className="flex-1 py-4 ml-2 text-base"
              placeholder="Enter your display name"
              placeholderTextColor="#9CA3AF"
              value={displayName}
              onChangeText={onNameChange}
              autoCapitalize="words"
            />
          </View>
        </View>
      )}

      <View className="mb-4">
        <Text className="text-xs text-gray-500 mb-1 ml-1">Email</Text>
        <View className="flex-row items-center bg-gray-100 border border-gray-200 rounded-2xl px-4">
          <Ionicons name="mail-outline" size={18} color="#9CA3AF" />
          <Text className="flex-1 py-4 ml-2 text-base text-gray-400">{email}</Text>
          <Ionicons name="lock-closed-outline" size={14} color="#D1D5DB" />
        </View>
      </View>

      <TouchableOpacity
        className="flex-row items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 mb-3"
        onPress={onChangePassword}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center">
          <Ionicons name="key-outline" size={18} color="#9CA3AF" />
          <Text className="ml-2 text-base text-gray-700">Change Password</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      </TouchableOpacity>

      {verificationStatus === 'not_verified' && (
        <TouchableOpacity
          testID="verify-account-btn"
          className="flex-row items-center justify-between bg-[#FEA405] rounded-2xl px-4 py-4"
          onPress={onVerify}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center">
            <Ionicons name="shield-checkmark-outline" size={18} color="white" />
            <Text className="ml-2 text-base text-white font-semibold">Verify Account</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}
