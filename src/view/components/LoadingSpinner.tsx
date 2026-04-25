import { View, ActivityIndicator } from 'react-native';

interface Props {
  color?: string;
  size?: 'small' | 'large';
}

export default function LoadingSpinner({ color = '#FEA405', size = 'large' }: Props) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}
