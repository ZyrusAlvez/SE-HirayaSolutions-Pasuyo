import { useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ACCENT = '#FEA405';

let WebView: any;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

function buildMapHtml(lat: number, lng: number, isNative: boolean) {
  const post = (msg: string) => isNative
    ? `window.ReactNativeWebView.postMessage(${msg})`
    : `window.parent.postMessage(${msg}, '*')`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js"></script>
  <style>
    body{margin:0}#map{height:100vh;width:100vw}
    .yellow-marker{width:25px;height:41px;position:relative}
    .yellow-marker svg{width:25px;height:41px}
  </style>
</head>
<body>
<div id="map"></div>
<script>
  const map = L.map('map').setView([${lat}, ${lng}], 15);
  L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',{attribution:'© CartoDB'}).addTo(map);
  const yellowIcon = L.divIcon({className:'yellow-marker',html:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41"><path d="M12.5 0C5.6 0 0 5.6 0 12.5 0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z" fill="#FEA405"/><circle cx="12.5" cy="12.5" r="5" fill="#fff"/></svg>',iconSize:[25,41],iconAnchor:[12,41],popupAnchor:[0,-34]});
  let marker = L.marker([${lat}, ${lng}], {draggable:true, icon:yellowIcon}).addTo(map);

  function sendLocation(lat, lng) {
    fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat='+lat+'&lon='+lng)
      .then(r=>r.json())
      .then(d=>{ ${post('JSON.stringify({lat, lng, name: d.display_name || \'\'})')}; })
      .catch(()=>{ ${post('JSON.stringify({lat, lng, name: \'\'})')}; });
  }

  sendLocation(${lat}, ${lng});
  marker.on('dragend', function(e){ const {lat,lng}=e.target.getLatLng(); sendLocation(lat,lng); });
  map.on('click', function(e){ marker.setLatLng(e.latlng); sendLocation(e.latlng.lat,e.latlng.lng); });
  const geocoder = L.Control.geocoder({defaultMarkGeocode:false}).addTo(map);
  geocoder.on('markgeocode', function(e){
    const {center}=e.geocode; marker.setLatLng(center); map.setView(center,16); sendLocation(center.lat,center.lng);
  });
</script>
</body>
</html>`;
}

function NativeErrandMap({ initialLat, initialLng, onPin }: {
  initialLat: number; initialLng: number;
  onPin: (lat: number, lng: number, name: string) => void;
}) {
  const htmlRef = useRef(buildMapHtml(initialLat, initialLng, true));
  return (
    <WebView
      source={{ html: htmlRef.current }}
      style={{ flex: 1 }}
      onMessage={(event: any) => {
        try {
          const d = JSON.parse(event.nativeEvent.data);
          onPin(d.lat, d.lng, d.name ?? '');
        } catch {}
      }}
    />
  );
}

function WebErrandMap({ initialLat, initialLng, onPin }: {
  initialLat: number; initialLng: number;
  onPin: (lat: number, lng: number, name: string) => void;
}) {
  const srcRef = useRef<string | null>(null);
  const onPinRef = useRef(onPin);
  useEffect(() => { onPinRef.current = onPin; }, [onPin]);

  if (!srcRef.current) {
    const blob = new Blob([buildMapHtml(initialLat, initialLng, false)], { type: 'text/html' });
    srcRef.current = URL.createObjectURL(blob);
  }

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data);
        if (d.lat && d.lng) onPinRef.current(d.lat, d.lng, d.name ?? '');
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return <iframe src={srcRef.current!} style={{ flex: 1, border: 'none', width: '100%', height: '100%' }} />;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  initialCoords: { lat: number; lng: number } | null;
  pinnedLocation: { lat: number; lng: number; name: string } | null;
  onPin: (lat: number, lng: number, name: string) => void;
}

export default function LocationMap({ visible, onClose, initialCoords, pinnedLocation, onPin }: Props) {
  const { width } = useWindowDimensions();
  const isLarge = width >= 768;
  const handlePin = useCallback(onPin, [onPin]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-white">
        <View style={{ alignSelf: 'center', width: '100%', maxWidth: isLarge ? 960 : undefined }} className="px-4 pt-4 pb-3 flex-row items-center border-b border-gray-100">
          <TouchableOpacity onPress={onClose} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-lg font-bold flex-1">Pin Location</Text>
          <TouchableOpacity onPress={onClose} className="px-4 py-2 rounded-xl" style={{ backgroundColor: ACCENT }}>
            <Text className="text-white font-semibold">Confirm</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, alignSelf: 'center', width: '100%', maxWidth: isLarge ? 960 : undefined }}>
          {initialCoords && (
            Platform.OS === 'web' ? (
              <WebErrandMap initialLat={initialCoords.lat} initialLng={initialCoords.lng} onPin={handlePin} />
            ) : (
              WebView && (
                <NativeErrandMap initialLat={initialCoords.lat} initialLng={initialCoords.lng} onPin={handlePin} />
              )
            )
          )}
        </View>

        {pinnedLocation && (
          <View style={{ alignSelf: 'center', width: '100%', maxWidth: isLarge ? 960 : undefined }} className="px-4 py-3 border-t border-gray-100">
            <Text className="text-xs text-gray-500" numberOfLines={2}>{pinnedLocation.name}</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}
