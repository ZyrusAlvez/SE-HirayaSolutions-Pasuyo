import { View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChangeText, placeholder = 'Search by title or name...' }: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}>
      <Ionicons name="search-outline" size={16} color="#9CA3AF" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        style={{ flex: 1, fontSize: 13, color: '#111827', padding: 0, outlineStyle: 'none' } as any}
      />
      {value.length > 0 && (
        <Ionicons name="close-circle" size={16} color="#9CA3AF" onPress={() => onChangeText('')} />
      )}
    </View>
  );
}
