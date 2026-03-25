import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Platform, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import ErrandListPanel from './ErrandListPanel';

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
  deadline?: string;
  images?: string[];
  poster_name?: string;
  poster_avatar?: string;
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
    L.marker([${lat}, ${lng}], { icon: userIcon }).addTo(map).bindPopup('You are here');
    const errandIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
    });
    const markers = {};
    ${JSON.stringify(errands)}.forEach(e => {
      const m = L.marker([e.location_lat, e.location_lng], { icon: errandIcon }).addTo(map);
      m.bindPopup('<strong>' + e.title + '</strong>' + (e.location_name ? '<br><small>' + e.location_name + '</small>' : ''));
      markers[e.id] = m;
      m.on('click', function() {
        const msg = JSON.stringify({ type: 'markerClick', id: e.id });
        if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
        else window.parent.postMessage(msg, '*');
      });
    });
    // Listen for flyTo commands from React Native
    document.addEventListener('message', function(event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'flyTo' && markers[data.id]) {
          map.flyTo([data.lat, data.lng], 17, { animate: true, duration: 0.8 });
          markers[data.id].openPopup();
        }
      } catch(e) {}
    });
    window.addEventListener('message', function(event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'flyTo' && markers[data.id]) {
          map.flyTo([data.lat, data.lng], 17, { animate: true, duration: 0.8 });
          markers[data.id].openPopup();
        }
      } catch(e) {}
    });
  </script>
</body>
</html>`;
}

// Web-only: component that controls the react-leaflet map instance
function WebMapController({ target }: { target: Errand | null }) {
  const { useMap } = require('react-leaflet');
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.location_lat, target.location_lng], 17, { animate: true, duration: 0.8 });
  }, [target?.id]);
  return null;
}

export default function OnsiteMap({ errands, location }: Props) {
  const [WebMap, setWebMap] = useState<any>(null);
  const [listOpen, setListOpen] = useState(false);
  const [flyTarget, setFlyTarget] = useState<Errand | null>(null);
  const [clickedErrandId, setClickedErrandId] = useState<string | null>(null);
  const [isTablet, setIsTablet] = useState(Dimensions.get('window').width >= 600);
  const webViewRef = useRef<any>(null);
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setIsTablet(window.width >= 600);
    });
    return () => sub.remove();
  }, []);

  const openPanel = (errandId?: string) => {
    setClickedErrandId(errandId ?? null);
    setListOpen(true);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 14 }).start();
  };

  const closePanel = () => {
    Animated.spring(slideAnim, { toValue: 400, useNativeDriver: true, bounciness: 0, speed: 14 }).start(() => {
      setListOpen(false);
      setClickedErrandId(null);
    });
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      import('./WebMap').then((mod) => setWebMap(() => mod.default));
    }
  }, []);

  function onSelect(errand: Errand) {
    closePanel();
    if (Platform.OS !== 'web') {
      // Send flyTo message into the WebView
      webViewRef.current?.injectJavaScript(`
        map.flyTo([${errand.location_lat}, ${errand.location_lng}], 17, { animate: true, duration: 0.8 });
        if (markers['${errand.id}']) markers['${errand.id}'].openPopup();
        true;
      `);
    } else {
      setFlyTarget(errand);
    }
  }

  const { latitude, longitude } = location.coords;

  const loading = (
    <View className="flex-1 items-center justify-center">
      <Ionicons name="map-outline" size={48} color="#9CA3AF" />
      <Text className="text-gray-500 mt-2">Loading map...</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, flexDirection: isTablet ? 'row' : 'column', position: 'relative', overflow: 'hidden', gap: isTablet ? 12 : 0, padding: isTablet ? 12 : 0 } as any}>
      {/* Map */}
      <View style={{ flex: 1, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 }} className="bg-gray-100">
        {Platform.OS === 'web'
          ? WebMap
            ? <WebMap latitude={latitude} longitude={longitude} errands={errands} onMarkerClick={(e: Errand) => openPanel(e.id)}>
                <WebMapController target={flyTarget} />
              </WebMap>
            : loading
          : WebView
            ? <WebView
                ref={webViewRef}
                source={{ html: buildMapHtml(latitude, longitude, errands) }}
                style={{ flex: 1 }}
                onMessage={(e: { nativeEvent: { data: string } }) => {
                  try {
                    const data = JSON.parse(e.nativeEvent.data);
                    if (data.type === 'markerClick') openPanel(data.id);
                  } catch {}
                }}
              />
            : loading
        }
      </View>

      {/* Burger button — mobile only */}
      {!isTablet && (
        <View style={{ position: 'absolute', top: 12, right: 12, zIndex: 800 }}>
          <TouchableOpacity
            onPress={() => listOpen ? closePanel() : openPanel()}
            style={{ backgroundColor: 'white', borderRadius: 12, padding: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 }}
            activeOpacity={0.8}
          >
            <Ionicons name={listOpen ? 'close' : 'list'} size={20} color="#111827" />
          </TouchableOpacity>
        </View>
      )}

      {/* Tablet: static sidebar / Mobile: slide panel */}
      {isTablet ? (
        <ErrandListPanel
          static
          errands={errands}
          visible={false}
          slideAnim={slideAnim}
          onClose={() => {}}
          onSelect={onSelect}
          expandedId={clickedErrandId}
        />
      ) : (
        <ErrandListPanel
          errands={errands}
          visible={listOpen}
          slideAnim={slideAnim}
          onClose={closePanel}
          onSelect={onSelect}
          expandedId={clickedErrandId}
        />
      )}
    </View>
  );
}
