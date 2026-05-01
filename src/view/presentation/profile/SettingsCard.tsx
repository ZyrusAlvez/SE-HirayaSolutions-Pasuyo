import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { VerificationStatus } from '@/models/profileModel';

type Props = {
  contentWidth: number | undefined;
  isLarge: boolean;
  verificationStatus: VerificationStatus;
  onChangePassword: () => void;
  onVerify: () => void;
};

export default function SettingsCard({ contentWidth, isLarge, verificationStatus, onChangePassword, onVerify }: Props) {
  return (
    <View style={{ width: contentWidth, alignSelf: isLarge ? 'center' : undefined, marginHorizontal: isLarge ? 0 : 16, backgroundColor: '#fff', borderRadius: 24, padding: 24, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Settings</Text>

      <TouchableOpacity
        onPress={onChangePassword}
        activeOpacity={0.7}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: verificationStatus === 'not_verified' ? 12 : 0 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="key-outline" size={18} color="#9CA3AF" />
          <Text style={{ marginLeft: 8, fontSize: 16, color: '#374151' }}>Change Password</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      </TouchableOpacity>

      {verificationStatus === 'not_verified' && (
        <TouchableOpacity
          onPress={onVerify}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FEA405', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="shield-checkmark-outline" size={18} color="white" />
            <Text style={{ marginLeft: 8, fontSize: 16, color: 'white', fontWeight: '600' }}>Verify Account</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}
