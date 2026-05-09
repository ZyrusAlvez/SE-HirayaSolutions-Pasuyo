import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AddressDropdownProps {
  label: string;
  placeholder: string;
  value: { code: string; name: string } | null;
  onSelect: (item: { code: string; name: string }) => void;
  items: { code: string; name: string }[];
  loading: boolean;
  disabled?: boolean;
  testID?: string;
}

export default function AddressDropdown({
  label,
  placeholder,
  value,
  onSelect,
  items,
  loading,
  disabled = false,
  testID,
}: AddressDropdownProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View className="mb-4">
      <Text className="text-xs text-gray-500 mb-1 ml-1">{label} *</Text>
      <TouchableOpacity
        testID={testID}
        className={`bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 flex-row items-center justify-between ${
          disabled ? 'opacity-50' : ''
        }`}
        onPress={() => !disabled && setVisible(true)}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Text className={value ? 'text-gray-800' : 'text-gray-400'}>
          {value?.name || placeholder}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color="#FEA405" />
        ) : (
          <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
        )}
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl max-h-[70%]">
            <View className="flex-row justify-between items-center px-4 py-4 border-b border-gray-200">
              <Text className="font-semibold text-gray-800 text-lg">{label}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <ScrollView className="px-4">
              {items.map((item) => (
                <TouchableOpacity
                  key={item.code}
                  testID={testID ? `${testID}-option-${items.indexOf(item)}` : undefined}
                  className="py-4 border-b border-gray-100"
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text className={`text-base ${
                    value?.code === item.code ? 'text-[#FEA405] font-semibold' : 'text-gray-800'
                  }`}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
