import { useState, useEffect } from 'react';
import { View, Alert } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import HomeHeader from '../components/home/HomeHeader';
import ErrandTabToggle from '../components/home/ErrandTabToggle';
import OnsiteMap from '../components/home/OnsiteMap';
import RemoteErrandList from '../components/home/RemoteErrandList';
import HomeNavBar from '../components/home/HomeNavBar';

const DEFAULT_AVATAR = require('../assets/images/default_profile.jpg');

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
}

export default function HomeScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<any>(DEFAULT_AVATAR);
  const [errands, setErrands] = useState<Errand[]>([]);
  const [tab, setTab] = useState<'onsite' | 'remote'>('onsite');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const url = user.user_metadata.custom_avatar_url || user.user_metadata.avatar_url;
        if (url && url !== 'default') setAvatarUrl({ uri: url });
      }
    });
  }, []);

  useEffect(() => {
    supabase
      .from('errands_with_poster')
      .select('id, title, description, is_remote, location_lat, location_lng, location_name, budget, deadline, images, poster_name, poster_avatar')
      .eq('status', 'open')
      .then(({ data }) => { if (data) setErrands(data); });
  }, []);

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
      <HomeHeader avatarUrl={avatarUrl} />
      <ErrandTabToggle tab={tab} onTabChange={setTab} />
      <View className="flex-1 px-6 pb-4">
        {tab === 'onsite'
          ? location && <OnsiteMap errands={onsiteErrands} location={location} />
          : <RemoteErrandList errands={remoteErrands} />
        }
      </View>
      <HomeNavBar />
    </View>
  );
}
