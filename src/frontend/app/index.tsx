import { useState, useEffect, useCallback } from 'react';
import { View, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { postErrandStore } from '../lib/postErrandStore';
import Header from '../components/layout/Header';
import NavBar from '../components/layout/NavBar';
import ErrandTabToggle from '../components/home/ErrandTabToggle';
import OnsiteMap from '../components/home/OnsiteMap';
import RemoteErrandList from '../components/home/RemoteErrandList';

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
  const [errands, setErrands] = useState<Errand[]>([]);
  const [tab, setTab] = useState<'onsite' | 'remote'>('onsite');
  const [expandId, setExpandId] = useState<string | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const url = user.user_metadata.custom_avatar_url || user.user_metadata.avatar_url;
        if (url && url !== 'default') setAvatarUrl({ uri: url });
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
    supabase
      .from('errands_with_poster')
      .select('id, title, description, is_remote, location_lat, location_lng, location_name, budget, deadline, images, poster_name, poster_avatar, poster_is_verified')
      .eq('status', 'open')
      .then(({ data }) => { if (data) setErrands(data); });
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
      <Header avatarUrl={avatarUrl} />
      <ErrandTabToggle tab={tab} onTabChange={setTab} />
      <View className="flex-1 px-6 pb-4">
        {tab === 'onsite'
          ? location && <OnsiteMap errands={onsiteErrands} location={location} expandId={expandId} />
          : <RemoteErrandList errands={remoteErrands} />
        }
      </View>
      <NavBar />
    </View>
  );
}
