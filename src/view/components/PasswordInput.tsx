import { useState } from 'react';
import { TextInput, View, Text, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label?: string;
  required?: boolean;
}

export default function PasswordInput({ label, required, className = '', ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-xs text-gray-500 mb-1 ml-1">
          {label} {required && '*'}
        </Text>
      )}
      <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4 flex-row items-center">
        <TextInput
          className={`flex-1 py-4 text-base outline-none ${className}`}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!visible}
          {...props}
        />
        <TouchableOpacity onPress={() => setVisible(v => !v)} activeOpacity={0.7}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
