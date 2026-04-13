import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Alert, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { fetchErrands, filterOnsiteErrands, filterRemoteErrands } from '@/controllers/errandController';
import type { Errand } from '@/controllers/errandController';
import { loadProfile } from '@/controllers/profileController';
import Header from '@/view/components/Header';
import NavBar from '@/view/components/NavBar';
import ErrandTabToggle from '@/view/presentation/home/ErrandTabToggle';
import OnsiteMap from '@/view/presentation/home/OnsiteMap';
import RemoteErrandList from '@/view/presentation/home/RemoteErrandList';
import SkeletonLoading from '@/view/presentation/home/SkeletonLoading';

const DEFAULT_AVATAR = require('../assets/images/default_profile.jpg');

export default function HomeScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<any>(DEFAULT_AVATAR);
  const [verificationStatus, setVerificationStatus] = useState<'verified' | 'pending' | 'not_verified'>('not_verified');
  const [errands, setErrands] = useState<Errand[]>([]);
  const [loadingErrands, setLoadingErrands] = useState(true);
  const hasLoaded = useRef(false);
  const [tab, setTab] = useState<'onsite' | 'remote'>('onsite');
  const [expandId, setExpandId] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadProfile().then((result) => {
      if (result.success && result.data) {
        if (result.data.avatarUrl) setAvatarUrl({ uri: result.data.avatarUrl });
        setVerificationStatus(result.data.verificationStatus);
      }
    });
  }, []);

  useFocusEffect(useCallback(() => {
    setExpandId(undefined);
    if (!hasLoaded.current) setLoadingErrands(true);
    fetchErrands().then((result) => {
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
              : <OnsiteMap errands={filterOnsiteErrands(errands) as any[]} location={location} expandId={expandId} />
            : <RemoteErrandList errands={filterRemoteErrands(errands)} />
          }
        </View>
      </View>
      <NavBar />
    </View>
  );
}
