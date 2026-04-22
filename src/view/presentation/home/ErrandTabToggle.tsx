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
  return <TabToggle tabs={TABS} activeKey={tab} onTabChange={(key) => onTabChange(key as 'onsite' | 'remote')} />;
}
