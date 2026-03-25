import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, useWindowDimensions, Platform, Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import Header from '../../components/layout/Header';
import NavBar from '../../components/layout/NavBar';

const ACCENT = '#FEA405';
const DEFAULT_AVATAR = require('../../assets/images/default_profile.jpg');

interface Errand {
  id: string;
  title: string;
  description: string;
  is_remote: boolean;
  is_open: boolean;
  location_lat: number | null;
  location_lng: number | null;
  location_name?: string;
  address_details?: string;
  budget?: number;
  deadline?: string;
  images?: string[];
  status: string;
  created_at: string;
  poster_name?: string;
  poster_avatar?: string;
  poster_rating?: number;
  poster_is_verified?: boolean;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <FontAwesome key={i} name={i <= Math.round(rating) ? 'star' : 'star-o'} size={12} color={ACCENT} />
      ))}
      <Text style={{ fontSize: 11, color: '#6B7280', marginLeft: 4 }}>{rating.toFixed(1)}</Text>
    </View>
  );
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

export default function ErrandDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [errand, setErrand] = useState<Errand | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<any>(DEFAULT_AVATAR);

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
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setErrand(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        <Header avatarUrl={avatarUrl} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={ACCENT} />
        </View>
        <NavBar />
      </View>
    );
  }

  if (!errand) {
    return (
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        <Header avatarUrl={avatarUrl} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="alert-circle-outline" size={48} color="#E5E7EB" />
          <Text style={{ color: '#9CA3AF', marginTop: 8 }}>Errand not found</Text>
        </View>
        <NavBar />
      </View>
    );
  }

  const deadline = errand.deadline
    ? new Date(errand.deadline).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const postedOn = new Date(errand.created_at).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const typeLabel = errand.is_remote ? 'Remote Errand' : 'Onsite Errand';
  const typeColor = errand.is_remote ? '#3B82F6' : '#10B981';

  const statusColor = errand.is_open ? '#10B981' : '#6B7280';
  const statusLabel = errand.is_open ? 'Open' : 'Closed';

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <Header avatarUrl={avatarUrl} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ alignSelf: 'center', width: '100%', maxWidth: width >= 768 ? 680 : undefined, padding: 20, gap: 16 }}>

          {/* Back button + type badge */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color="#374151" />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>Back</Text>
            </TouchableOpacity>
            <View style={{ backgroundColor: typeColor + '1A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: typeColor }}>{typeLabel}</Text>
            </View>
          </View>

          {/* Main card */}
          <View style={{
            backgroundColor: 'white', borderRadius: 16, padding: 20,
            shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
          }}>

            {/* Title + status */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827', flex: 1 }}>{errand.title}</Text>
              <View style={{ backgroundColor: statusColor + '1A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 2 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: statusColor }}>{statusLabel}</Text>
              </View>
            </View>

            <Divider />

            {/* Description */}
            <SectionLabel text="Description" />
            <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>{errand.description}</Text>

            {/* Budget + Deadline row */}
            {(errand.budget != null || deadline) && (
              <>
                <Divider />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {errand.budget != null && (
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Budget</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Ionicons name="cash-outline" size={14} color={ACCENT} />
                        <Text style={{ fontSize: 15, fontWeight: '700', color: '#D97706' }}>₱{errand.budget.toLocaleString()}</Text>
                      </View>
                    </View>
                  )}
                  {deadline && (
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Deadline</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Ionicons name="calendar-outline" size={14} color='#6B7280' />
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>{deadline}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* Location */}
            {errand.location_name && (
              <>
                <Divider />
                <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Location</Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  <Ionicons name="location-outline" size={15} color={ACCENT} style={{ marginTop: 1 }} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', flex: 1 }}>{errand.location_name}</Text>
                </View>
                {errand.address_details && (
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 6 }}>
                    <Ionicons name="map-outline" size={15} color="#9CA3AF" style={{ marginTop: 1 }} />
                    <Text style={{ fontSize: 13, color: '#6B7280', flex: 1, lineHeight: 19 }}>{errand.address_details}</Text>
                  </View>
                )}
              </>
            )}

            {/* Attachments */}
            {errand.images && errand.images.length > 0 && (
              <>
                <Divider />
                <SectionLabel text={`Attachments · ${errand.images.length}`} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {errand.images.map((uri, i) => (
                    <TouchableOpacity key={i} onPress={() => setPreviewUri(uri)} activeOpacity={0.8}>
                      <Image source={{ uri }} style={{ width: 72, height: 72, borderRadius: 10, backgroundColor: '#F3F4F6' }} resizeMode="cover" />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

          </View>

          {/* Poster */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
            <Image
              source={errand.poster_avatar && errand.poster_avatar !== 'default' ? { uri: errand.poster_avatar } : DEFAULT_AVATAR}
              style={{ width: 42, height: 42, borderRadius: 21 }}
            />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>
                  {errand.poster_name ?? 'Anonymous'}
                </Text>
                {errand.poster_is_verified && <MaterialIcons name="verified" size={14} color="#1D9BF0" />}
              </View>
              {errand.poster_rating != null && errand.poster_rating > 0 && <StarRating rating={errand.poster_rating} />}
              <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Posted {postedOn}</Text>
            </View>
          </View>

          {/* Apply button */}
          {errand.is_open && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={{ backgroundColor: ACCENT, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 4 }}
            >
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 15 }}>Apply for this Errand</Text>
            </TouchableOpacity>
          )}

        </View>
      </ScrollView>

      <NavBar />

      {/* Lightbox */}
      <Modal visible={!!previewUri} transparent animationType="fade" onRequestClose={() => setPreviewUri(null)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' }}
          activeOpacity={1}
          onPress={() => setPreviewUri(null)}
        >
          {previewUri && (
            <Image source={{ uri: previewUri }} style={{ width: width - 32, height: width - 32 }} resizeMode="contain" />
          )}
          <View style={{ position: 'absolute', top: Platform.OS !== 'web' ? 52 : 16, right: 20 }}>
            <Ionicons name="close-circle" size={30} color="rgba(255,255,255,0.7)" />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
