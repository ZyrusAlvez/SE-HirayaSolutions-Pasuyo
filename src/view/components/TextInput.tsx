import { TextInput as RNTextInput, View, Text, TextInputProps } from 'react-native';

interface CustomTextInputProps extends TextInputProps {
  label?: string;
  required?: boolean;
}

export default function TextInput({ label, required, className = '', ...props }: CustomTextInputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-xs text-gray-500 mb-1 ml-1">
          {label} {required && '*'}
        </Text>
      )}
      <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4">
        <RNTextInput
          className={`py-4 text-base outline-none ${className}`}
          placeholderTextColor="#9CA3AF"
          {...props}
        />
      </View>
    </View>
  );
}
