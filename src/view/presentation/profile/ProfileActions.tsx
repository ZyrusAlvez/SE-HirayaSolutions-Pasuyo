import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  isDirty: boolean;
  saving: boolean;
  contentWidth: number | undefined;
  isLarge: boolean;
  onSave: () => void;
  onLogout: () => void;
};

export default function ProfileActions({ isDirty, saving, contentWidth, isLarge, onSave, onLogout }: Props) {
  return (
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: Platform.OS === 'web' ? 16 : 32, paddingTop: 12, backgroundColor: '#F9FAFB', alignItems: isLarge ? 'center' : undefined }}>
      <View style={{ width: contentWidth ?? '100%' }}>
        {isDirty && (
          <TouchableOpacity
            className="bg-[#FEA405] py-4 rounded-2xl mb-3"
            onPress={onSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-semibold text-center">
              {saving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          className="bg-white border border-red-300 py-4 rounded-2xl flex-row items-center justify-center"
          onPress={onLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text className="text-red-500 text-base font-semibold ml-2">Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
