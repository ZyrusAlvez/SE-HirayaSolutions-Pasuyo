import { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

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

interface Props {
  errands: Errand[];
  location: Location.LocationObject;
}

function buildMapHtml(lat: number, lng: number, errands: Errand[]) {
  return `<!DOCTYPE html>
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
    .user-dot-ring { position:absolute;inset:0;border-radius:50%;background:rgba(254,164,5,0.3);animation:pulse 1.8s ease-out infinite; }
    .user-dot-core { position:absolute;inset:4px;border-radius:50%;background:#FEA405;border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,0.3); }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map').setView([${lat}, ${lng}], 15);
    L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', { attribution: '© CartoDB' }).addTo(map);
    const userIcon = L.divIcon({
      className: '',
      html: '<div style="position:relative;width:24px;height:24px"><div class="user-dot-ring"></div><div class="user-dot-core"></div></div>',
      iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -14]
    });
    L.marker([${lat}, ${lng}], { icon: userIcon }).addTo(map).bindPopup('You are here').openPopup();
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
</html>`;
}

export default function OnsiteMap({ errands, location }: Props) {
  const [WebMap, setWebMap] = useState<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      import('../WebMap').then((mod) => setWebMap(() => mod.default));
    }
  }, []);

  const { latitude, longitude } = location.coords;
  const loading = (
    <View className="flex-1 items-center justify-center">
      <Ionicons name="map-outline" size={48} color="#9CA3AF" />
      <Text className="text-gray-500 mt-2">Loading map...</Text>
    </View>
  );

  return (
    <View className="flex-1 rounded-2xl overflow-hidden shadow-md bg-gray-100">
      {Platform.OS === 'web'
        ? WebMap
          ? <WebMap latitude={latitude} longitude={longitude} errands={errands} />
          : loading
        : WebView
          ? <WebView source={{ html: buildMapHtml(latitude, longitude, errands) }} style={{ flex: 1 }} />
          : loading
      }
    </View>
  );
}
