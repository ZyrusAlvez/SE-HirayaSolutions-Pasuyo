import { useState } from 'react';
import { View, Platform, TouchableOpacity, Modal, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

let WebView: any;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

function buildHtml(lat: number, lng: number) {
  return `<!DOCTYPE html><html><head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>body{margin:0}#map{height:100vh;width:100vw}</style>
</head><body><div id="map"></div>
<script>
  const map = L.map('map', { zoomControl:false, dragging:false, scrollWheelZoom:false, doubleClickZoom:false, touchZoom:false }).setView([${lat},${lng}], 15);
  L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',{attribution:'© CartoDB'}).addTo(map);
  L.marker([${lat},${lng}]).addTo(map);
</script></body></html>`;
}

interface Props {
  lat: number;
  lng: number;
}

function MapContent({ lat, lng, interactive = false }: { lat: number; lng: number; interactive?: boolean }) {
  const html = interactive ? buildHtml(lat, lng).replace(
    'dragging:false, scrollWheelZoom:false, doubleClickZoom:false, touchZoom:false',
    'dragging:true, scrollWheelZoom:true, doubleClickZoom:true, touchZoom:true'
  ).replace('zoomControl:false', 'zoomControl:true') : buildHtml(lat, lng);

  if (Platform.OS === 'web') {
    const blob = new Blob([html], { type: 'text/html' });
    const src = URL.createObjectURL(blob);
    return <iframe src={src} style={{ width: '100%', height: '100%', border: 'none' }} />;
  }
  return <WebView source={{ html }} style={{ flex: 1 }} scrollEnabled={false} />;
}

export default function ErrandMinimap({ lat, lng }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <View style={{ height: 160, borderRadius: 12, overflow: 'hidden' }}>
        <MapContent lat={lat} lng={lng} />
        <TouchableOpacity
          onPress={() => setExpanded(true)}
          activeOpacity={0.8}
          style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'white', borderRadius: 8, padding: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 }}
        >
          <Ionicons name="expand-outline" size={16} color="#111827" />
        </TouchableOpacity>
      </View>

      <Modal visible={expanded} animationType="slide" onRequestClose={() => setExpanded(false)}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: 'white' }}>
            <TouchableOpacity onPress={() => setExpanded(false)} style={{ marginRight: 12 }}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Location</Text>
          </View>
          <View style={{ flex: 1 }}>
            <MapContent lat={lat} lng={lng} interactive />
          </View>
        </View>
      </Modal>
    </>
  );
}
