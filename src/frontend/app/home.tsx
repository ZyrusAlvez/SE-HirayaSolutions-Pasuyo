import { useState, useEffect } from 'react';
import { View, TouchableOpacity, Alert, Platform, Image, Text } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

let WebView: any;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

export default function HomeScreen() {
  const router = useRouter();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [WebMap, setWebMap] = useState<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      import('../components/WebMap').then((mod) => setWebMap(() => mod.default));
    }
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
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map').setView([${location.coords.latitude}, ${location.coords.longitude}], 15);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(map);
        L.marker([${location.coords.latitude}, ${location.coords.longitude}])
          .addTo(map)
          .bindPopup('You are here')
          .openPopup();
      </script>
    </body>
    </html>
  ` : '';

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white px-6 pt-12 pb-4 flex-row items-center justify-between border-b border-gray-100">
        <TouchableOpacity className="p-2" activeOpacity={0.7}>
          <Ionicons name="menu" size={28} color="#000" />
        </TouchableOpacity>
        <Image 
          source={require('../assets/logo/Pasuyo_full.png')}
          style={{ width: 120, height: 40 }}
          resizeMode="contain"
        />
        <TouchableOpacity 
          className="p-2" 
          onPress={() => router.push('/profile')}
          activeOpacity={0.7}
        >
          <Ionicons name="person-circle-outline" size={28} color="#FEA405" />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View className="flex-1 px-6 py-4">
        <View className="flex-1 rounded-2xl overflow-hidden shadow-md bg-gray-100">
          {Platform.OS === 'web' ? (
            location && WebMap ? (
              <WebMap latitude={location.coords.latitude} longitude={location.coords.longitude} />
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
        <TouchableOpacity className="items-center" activeOpacity={0.7}>
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
