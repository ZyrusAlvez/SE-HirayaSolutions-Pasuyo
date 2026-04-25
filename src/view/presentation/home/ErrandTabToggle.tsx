import TabToggle from '@/view/components/TabToggle';

const TABS = [
  { key: 'onsite', label: 'Onsite Errands', icon: 'location-outline' },
  { key: 'remote', label: 'Remote Errands', icon: 'cloud-outline' },
];

interface Props {
  tab: 'onsite' | 'remote';
  onTabChange: (tab: 'onsite' | 'remote') => void;
}

export default function ErrandTabToggle({ tab, onTabChange }: Props) {
<<<<<<< HEAD
  return (
    <View className="flex-row mx-6 mt-4 mb-2 bg-gray-100 rounded-xl p-1">
      <TouchableOpacity
        className={`flex-1 py-2 rounded-lg flex-row items-center justify-center gap-1 ${tab === 'onsite' ? 'bg-white shadow' : ''}`}
        onPress={() => onTabChange('onsite')}
        activeOpacity={0.8}
      >
        <Ionicons name="location-outline" size={15} color={tab === 'onsite' ? '#111827' : '#9CA3AF'} />
        <Text className={`text-sm font-semibold ${tab === 'onsite' ? 'text-gray-900' : 'text-gray-400'}`}>
          Onsite Errands
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="tab-remote"
        className={`flex-1 py-2 rounded-lg flex-row items-center justify-center gap-1 ${tab === 'remote' ? 'bg-white shadow' : ''}`}
        onPress={() => onTabChange('remote')}
        activeOpacity={0.8}
      >
        <Ionicons name="globe-outline" size={15} color={tab === 'remote' ? '#111827' : '#9CA3AF'} />
        <Text className={`text-sm font-semibold ${tab === 'remote' ? 'text-gray-900' : 'text-gray-400'}`}>
          Remote Errands
        </Text>
      </TouchableOpacity>
    </View>
  );
=======
  return <TabToggle tabs={TABS} activeKey={tab} onTabChange={(key) => onTabChange(key as 'onsite' | 'remote')} />;
>>>>>>> a673190613b66e7bf3ddbe3997b32754c19e02b3
}
