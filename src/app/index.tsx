import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Platform, AppState } from 'react-native';
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
  const [locationDenied, setLocationDenied] = useState(false);
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

  const checkLocation = useCallback(async () => {
    if (Platform.OS === 'web' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationDenied(false);
          setLocation({ coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude, altitude: pos.coords.altitude, accuracy: pos.coords.accuracy, altitudeAccuracy: pos.coords.altitudeAccuracy, heading: pos.coords.heading, speed: pos.coords.speed }, timestamp: pos.timestamp } as Location.LocationObject);
        },
        () => setLocationDenied(true),
      );
      return;
    }
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') { setLocationDenied(true); return; }
    setLocationDenied(false);
    setLocation(await Location.getCurrentPositionAsync({}));
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationDenied(true);
        return;
      }
      setLocationDenied(false);
      setLocation(await Location.getCurrentPositionAsync({}));
    })();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && locationDenied) checkLocation();
    });
    return () => sub.remove();
  }, [locationDenied, checkLocation]);

  return (
    <View className="flex-1 bg-white">
      <Header avatarUrl={avatarUrl} verificationStatus={verificationStatus} />
      <View style={[{ flex: 1 }, Platform.OS === 'web' && { maxWidth: 1200, width: '100%', alignSelf: 'center' as const }]}>
        <ErrandTabToggle tab={tab} onTabChange={setTab} />
        <View className="flex-1 px-6 pb-4">
          {tab === 'onsite'
            ? (loadingErrands || !location)
              ? <SkeletonLoading locationDenied={locationDenied} onRetryLocation={checkLocation} />
              : <OnsiteMap errands={errands.filter(e => !e.is_remote && e.location_lat && e.location_lng) as any[]} location={location} expandId={expandId} />
            : <RemoteErrandList errands={errands.filter(e => e.is_remote)} />
          }
        </View>
      </View>
      <NavBar />
    </View>
  );
}
