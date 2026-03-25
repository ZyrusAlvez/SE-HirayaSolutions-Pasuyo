import { useState, useEffect } from 'react';
import { View, TouchableOpacity, Alert, Platform, Image, Text } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

const DEFAULT_AVATAR = require('../assets/images/default_profile.jpg');

let WebView: any;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

interface Errand {
  id: string;
  title: string;
  description: string;
  location_lat: number;
  location_lng: number;
  location_name?: string;
  budget?: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [WebMap, setWebMap] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<any>(DEFAULT_AVATAR);
  const [errands, setErrands] = useState<Errand[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const url = user.user_metadata.custom_avatar_url || user.user_metadata.avatar_url;
        if (url && url !== 'default') setAvatarUrl({ uri: url });
      }
    });
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      import('../components/WebMap').then((mod) => setWebMap(() => mod.default));
    }
  }, []);

  useEffect(() => {
    supabase
      .from('errands')
      .select('id, title, description, location_lat, location_lng, location_name, budget')
      .eq('status', 'open')
      .not('location_lat', 'is', null)
      .not('location_lng', 'is', null)
      .then(({ data }) => { if (data) setErrands(data); });
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use this app');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();
  }, []);

  const mapHtml = location ? `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
        @keyframes pulse {
          0%{transform:scale(1);opacity:0.8}
          100%{transform:scale(2.5);opacity:0}
        }
        .user-dot-ring {
          position:absolute;inset:0;border-radius:50%;
          background:rgba(254,164,5,0.3);
          animation:pulse 1.8s ease-out infinite;
        }
        .user-dot-core {
          position:absolute;inset:4px;border-radius:50%;
          background:#FEA405;
          border:2px solid #fff;
          box-shadow:0 0 4px rgba(0,0,0,0.3);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map').setView([${location.coords.latitude}, ${location.coords.longitude}], 15);
        L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
          attribution: '© CartoDB'
        }).addTo(map);
        const userIcon = L.divIcon({
          className: '',
          html: '<div style="position:relative;width:24px;height:24px"><div class="user-dot-ring"></div><div class="user-dot-core"></div></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -14]
        });
        L.marker([${location.coords.latitude}, ${location.coords.longitude}], { icon: userIcon })
          .addTo(map)
          .bindPopup('You are here')
          .openPopup();
        const errandIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
        });
        ${JSON.stringify(errands)}.forEach(e => {
          L.marker([e.location_lat, e.location_lng], { icon: errandIcon })
            .addTo(map)
            .bindPopup('<strong>' + e.title + '</strong><br>' + e.description + (e.location_name ? '<br>' + e.location_name : '') + (e.budget != null ? '<br>Budget: ₱' + e.budget : ''));
        });
      </script>
    </body>
    </html>
  ` : '';

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className={`bg-white px-6 pb-4 flex-row items-center justify-between border-b border-gray-100 ${Platform.OS !== 'web' ? 'pt-12' : 'pt-4'}`}>
        <TouchableOpacity className="p-2" activeOpacity={0.7}>
          <Ionicons name="menu" size={28} color="#000" />
        </TouchableOpacity>
        <Image 
          source={require('../assets/logo/Pasuyo_full.png')}
          style={{ width: 120, height: 40 }}
          resizeMode="contain"
        />
        <TouchableOpacity 
          onPress={() => router.push('/profile')}
          activeOpacity={0.7}
        >
          <Image
            source={avatarUrl}
            style={{ width: 36, height: 36, borderRadius: 18 }}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View className="flex-1 px-6 py-4">
        <View className="flex-1 rounded-2xl overflow-hidden shadow-md bg-gray-100">
          {Platform.OS === 'web' ? (
            location && WebMap ? (
              <WebMap latitude={location.coords.latitude} longitude={location.coords.longitude} errands={errands} />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Ionicons name="map-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 mt-2">Loading map...</Text>
              </View>
            )
          ) : (
            location && WebView ? (
              <WebView
                source={{ html: mapHtml }}
                style={{ flex: 1 }}
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Ionicons name="map-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 mt-2">Loading map...</Text>
              </View>
            )
          )}
        </View>
      </View>

      {/* Navigation Bar */}
      <View className="bg-white px-6 py-4 flex-row justify-around border-t border-gray-100">
        <TouchableOpacity className="items-center" activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={24} color="#FEA405" />
          <Text className="text-xs mt-1 text-gray-700">Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center" activeOpacity={0.7} onPress={() => router.push('/post-errand')}>
          <Ionicons name="add-circle" size={32} color="#FEA405" />
          <Text className="text-xs mt-1 text-gray-700">Post Hustle</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center" activeOpacity={0.7}>
          <Ionicons name="list-outline" size={24} color="#FEA405" />
          <Text className="text-xs mt-1 text-gray-700">My Tasks</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
