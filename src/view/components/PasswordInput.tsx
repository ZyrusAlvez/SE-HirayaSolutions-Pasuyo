import { useState, useEffect, forwardRef } from 'react';
import { TextInput, View, Text, TouchableOpacity, TextInputProps, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label?: string;
  required?: boolean;
}

const PasswordInput = forwardRef<TextInput, PasswordInputProps>(({ label, required, className = '', ...props }, ref) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const style = document.createElement('style');
    style.textContent = 'input[type=password]::-ms-reveal, input[type=password]::-ms-clear { display: none; }';
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-xs text-gray-500 mb-1 ml-1">
          {label} {required && '*'}
        </Text>
      )}
      <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4 flex-row items-center">
        <TextInput
          ref={ref}
          className={`flex-1 py-4 text-base outline-none ${className}`}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!visible}
          style={{ WebkitTextSecurity: visible ? 'none' : 'disc' } as any}
          {...props}
        />
        <TouchableOpacity onPress={() => setVisible(v => !v)} activeOpacity={0.7}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default PasswordInput;
