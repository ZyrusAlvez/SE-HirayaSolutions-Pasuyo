import { View, Text } from 'react-native';
import ErrandInfoCard from './ErrandInfoCard';

interface Props {
  content: string;
}

export default function SystemMessage({ content }: Props) {
  let errandInfo: { type?: string; title?: string; description?: string; budget?: number } | null = null;
  try { errandInfo = JSON.parse(content); } catch {}

  if (errandInfo?.type === 'errand_accepted') {
    return (
      <View style={{ alignItems: 'center', marginVertical: 16 }}>
        <ErrandInfoCard title={errandInfo.title} description={errandInfo.description} budget={errandInfo.budget} />
        <View style={{ height: 1, backgroundColor: '#E5E7EB', width: '100%' }} />
        <Text style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', paddingVertical: 8, lineHeight: 16, fontStyle: 'italic' }}>This errand has been accepted</Text>
        <View style={{ height: 1, backgroundColor: '#E5E7EB', width: '100%' }} />
      </View>
    );
  }

  return (
    <View style={{ marginVertical: 16 }}>
      <View style={{ height: 1, backgroundColor: '#E5E7EB' }} />
      <Text style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', paddingVertical: 8, lineHeight: 16, fontStyle: 'italic' }}>{content}</Text>
      <View style={{ height: 1, backgroundColor: '#E5E7EB' }} />
    </View>
  );
}
