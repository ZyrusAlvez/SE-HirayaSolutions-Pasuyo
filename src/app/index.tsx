import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Alert, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { getErrands } from '@/controllers/errandController';
import type { Errand } from '@/controllers/errandController';
import { useProfile } from '@/context/ProfileContext';
import Header from '@/view/components/Header';
import NavBar from '@/view/components/NavBar';
import ErrandTabToggle from '@/view/presentation/home/ErrandTabToggle';
import OnsiteMap from '@/view/presentation/home/OnsiteMap';
import RemoteErrandList from '@/view/presentation/home/RemoteErrandList';
import SkeletonLoading from '@/view/presentation/home/SkeletonLoading';

export default function HomeScreen() {
  const { avatarUrl, verificationStatus } = useProfile();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errands, setErrands] = useState<Errand[]>([]);
  const [loadingErrands, setLoadingErrands] = useState(true);
  const hasLoaded = useRef(false);
  const [tab, setTab] = useState<'onsite' | 'remote'>('onsite');
  const [expandId, setExpandId] = useState<string | undefined>(undefined);

  useFocusEffect(useCallback(() => {
    setExpandId(undefined);
    if (!hasLoaded.current) setLoadingErrands(true);
    getErrands().then((result) => {
      if (result.success) setErrands(result.data);
      setLoadingErrands(false);
      hasLoaded.current = true;
    });
  }, []));

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use this app');
        return;
      }
      setLocation(await Location.getCurrentPositionAsync({}));
    })();
  }, []);

  return (
    <View className="flex-1 bg-white">
      <Header avatarUrl={avatarUrl} verificationStatus={verificationStatus} />
      <View style={[{ flex: 1 }, Platform.OS === 'web' && { maxWidth: 1200, width: '100%', alignSelf: 'center' as const }]}>
        <ErrandTabToggle tab={tab} onTabChange={setTab} />
        <View className="flex-1 px-6 pb-4">
          {tab === 'onsite'
            ? (loadingErrands || !location)
              ? <SkeletonLoading />
              : <OnsiteMap errands={errands.filter(e => !e.is_remote && e.location_lat && e.location_lng) as any[]} location={location} expandId={expandId} />
            : <RemoteErrandList errands={errands.filter(e => e.is_remote)} />
          }
        </View>
      </View>
      <NavBar />
    </View>
  );
}
