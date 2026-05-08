import { View } from 'react-native';

interface Props {
  contentWidth?: number;
  isLarge?: boolean;
}

export default function UserProfileSkeleton({ contentWidth, isLarge }: Props) {
  return (
    <>
      <View style={{ alignItems: 'center', paddingTop: 40, marginBottom: 24 }}>
        <View style={{ width: 112, height: 112, borderRadius: 56, backgroundColor: '#E5E7EB' }} />
        <View style={{ width: 140, height: 22, borderRadius: 8, backgroundColor: '#E5E7EB', marginTop: 16 }} />
        <View style={{ width: 80, height: 16, borderRadius: 8, backgroundColor: '#E5E7EB', marginTop: 8 }} />
      </View>
      <View style={{ marginHorizontal: 20, gap: 12, width: contentWidth, alignSelf: isLarge ? 'center' : undefined }}>
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 20, gap: 12 }}>
          <View style={{ width: '60%', height: 14, borderRadius: 6, backgroundColor: '#E5E7EB' }} />
          <View style={{ width: '80%', height: 14, borderRadius: 6, backgroundColor: '#E5E7EB' }} />
          <View style={{ width: '50%', height: 14, borderRadius: 6, backgroundColor: '#E5E7EB' }} />
        </View>
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 20, gap: 12 }}>
          <View style={{ width: '40%', height: 14, borderRadius: 6, backgroundColor: '#E5E7EB' }} />
          <View style={{ width: '70%', height: 14, borderRadius: 6, backgroundColor: '#E5E7EB' }} />
        </View>
      </View>
    </>
  );
}
