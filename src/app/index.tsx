import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Alert, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { supabase } from '../utils/supabase';
import { postErrandStore } from '../utils/postErrandStore';
import Header from '../components/layout/Header';
import NavBar from '../components/layout/NavBar';
import ErrandTabToggle from '../components/home/ErrandTabToggle';
import OnsiteMap from '../components/home/OnsiteMap';
import RemoteErrandList from '../components/home/RemoteErrandList';
import SkeletonLoading from '../components/home/SkeletonLoading';

interface Errand {
  id: string;
  title: string;
  description: string;
  is_remote: boolean;
  location_lat: number | null;
  location_lng: number | null;
  location_name?: string;
  budget?: number;
  deadline?: string;
  images?: string[];
  poster_name?: string;
  poster_avatar?: string;
  poster_is_verified?: boolean;
}

export default function HomeScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<any>(require('../assets/images/default_profile.jpg'));
  const [isVerified, setIsVerified] = useState(false);
  const [errands, setErrands] = useState<Errand[]>([]);
  const [loadingErrands, setLoadingErrands] = useState(true);
  const hasLoaded = useRef(false);
  const [tab, setTab] = useState<'onsite' | 'remote'>('onsite');
  const [expandId, setExpandId] = useState<string | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const url = user.user_metadata.custom_avatar_url || user.user_metadata.avatar_url;
        if (url && url !== 'default') setAvatarUrl({ uri: url });
        supabase.from('profiles').select('verified').eq('id', user.id).single()
          .then(({ data }) => { if (data?.verified) setIsVerified(true); });
      }
    });
  }, []);

  useFocusEffect(useCallback(() => {
    const result = postErrandStore.consume();
    if (result) {
      setTab(result.tab);
      setExpandId(result.expandId);
    } else {
      setExpandId(undefined);
    }
    if (!hasLoaded.current) setLoadingErrands(true);
    supabase
      .from('errands_with_profiles')
      .select('id, title, description, is_remote, location_lat, location_lng, location_name, budget, deadline, images, poster_name, poster_avatar, poster_is_verified')
      .eq('status', 'Available')
      .then(({ data }) => {
        if (data) setErrands(data);
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

  const onsiteErrands = errands.filter(e => !e.is_remote && e.location_lat && e.location_lng) as any[];
  const remoteErrands = errands.filter(e => e.is_remote);

  return (
    <View className="flex-1 bg-white">
      <Header avatarUrl={avatarUrl} isVerified={isVerified} />
      <View style={[{ flex: 1 }, Platform.OS === 'web' && { maxWidth: 1200, width: '100%', alignSelf: 'center' as const }]}>
        <ErrandTabToggle tab={tab} onTabChange={setTab} />
        <View className="flex-1 px-6 pb-4">
          {tab === 'onsite'
            ? (loadingErrands || !location)
              ? <SkeletonLoading />
              : <OnsiteMap errands={onsiteErrands} location={location} expandId={expandId} />
            : <RemoteErrandList errands={remoteErrands} />
          }
        </View>
      </View>
      <NavBar />
    </View>
  );
}
