import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ErrandMinimap from './ErrandMinimap';

const ACCENT = '#FEA405';

interface Props {
  title: string;
  description: string;
  isOpen: boolean;
  budget?: number;
  deadline?: string | null;
  locationName?: string;
  addressDetails?: string;
  locationLat?: number | null;
  locationLng?: number | null;
  images?: string[];
  onImagePress: (index: number) => void;
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 14 }} />;
}

function SectionLabel({ text }: { text: string }) {
  return (
    <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
      {text}
    </Text>
  );
}

export default function ErrandDetailCard({
  title, description, isOpen, budget, deadline,
  locationName, addressDetails, locationLat, locationLng, images = [], onImagePress,
}: Props) {
  const statusColor = isOpen ? '#10B981' : '#6B7280';
  const statusLabel = isOpen ? 'Open' : 'Closed';

  return (
    <View style={{
      backgroundColor: 'white', borderRadius: 16, padding: 20,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    }}>
      {/* Title + status */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827', flex: 1 }}>{title}</Text>
        <View style={{ backgroundColor: statusColor + '1A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 2 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: statusColor }}>{statusLabel}</Text>
        </View>
      </View>

      <Divider />

      {/* Description */}
      <SectionLabel text="Description" />
      <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>{description}</Text>

      {/* Budget + Deadline */}
      {(budget != null || deadline) && (
        <>
          <Divider />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {budget != null && (
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Budget</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Ionicons name="cash-outline" size={14} color={ACCENT} />
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#D97706' }}>₱{budget.toLocaleString()}</Text>
                </View>
              </View>
            )}
            {deadline && (
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Deadline</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>{deadline}</Text>
                </View>
              </View>
            )}
          </View>
        </>
      )}

      {/* Location */}
      {locationName && (
        <>
          <Divider />
          <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Location</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <Ionicons name="location-outline" size={15} color={ACCENT} style={{ marginTop: 1 }} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', flex: 1 }}>{locationName}</Text>
          </View>
          {addressDetails && (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 6 }}>
              <Ionicons name="map-outline" size={15} color="#9CA3AF" style={{ marginTop: 1 }} />
              <Text style={{ fontSize: 13, color: '#6B7280', flex: 1, lineHeight: 19 }}>{addressDetails}</Text>
            </View>
          )}
          {locationLat != null && locationLng != null && (
            <View style={{ marginTop: 12 }}>
              <ErrandMinimap lat={locationLat} lng={locationLng} />
            </View>
          )}
        </>
      )}

      {/* Attachments */}
      {images.length > 0 && (
        <>
          <Divider />
          <SectionLabel text={`Attachments · ${images.length}`} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {images.map((uri, i) => (
              <TouchableOpacity key={i} onPress={() => onImagePress(i)} activeOpacity={0.8}>
                <Image source={{ uri }} style={{ width: 72, height: 72, borderRadius: 10, backgroundColor: '#F3F4F6' }} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
}
