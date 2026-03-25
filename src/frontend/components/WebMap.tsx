import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userLocationIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:24px;height:24px;">
      <div style="
        position:absolute;inset:0;border-radius:50%;
        background:rgba(254,164,5,0.3);
        animation:pulse 1.8s ease-out infinite;
      "></div>
      <div style="
        position:absolute;inset:4px;border-radius:50%;
        background:#FEA405;
        border:2px solid #fff;
        box-shadow:0 0 4px rgba(0,0,0,0.3);
      "></div>
      <style>
        @keyframes pulse {
          0%{transform:scale(1);opacity:0.8}
          100%{transform:scale(2.5);opacity:0}
        }
      </style>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
});

interface Errand {
  id: string;
  title: string;
  description: string;
  location_lat: number;
  location_lng: number;
  location_name?: string;
  budget?: number;
}

interface WebMapProps {
  latitude: number;
  longitude: number;
  errands?: Errand[];
}

const errandIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function WebMap({ latitude, longitude, errands = [] }: WebMapProps) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={15}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
        url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} icon={userLocationIcon}>
        <Popup>You are here</Popup>
      </Marker>
      {errands.map((errand) => (
        <Marker key={errand.id} position={[errand.location_lat, errand.location_lng]} icon={errandIcon}>
          <Popup>
            <strong>{errand.title}</strong><br />
            {errand.description}<br />
            {errand.location_name && <>{errand.location_name}<br /></>}
            {errand.budget != null && <>Budget: ₱{errand.budget}</>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
