import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import Header from '../../components/layout/Header';
import NavBar from '../../components/layout/NavBar';
import DetailHeader from '../../components/errand/DetailHeader';
import DetailCard from '../../components/errand/DetailCard';
import PosterCard from '../../components/errand/PosterCard';
import ImageLightbox from '../../components/errand/ImageLightbox';
import SkeletonLoading from '../../components/errand/SkeletonLoading';
import OwnerActions from '../../components/errand/OwnerActions';
import EditErrandSheet from '../../components/errand/EditErrandSheet';

const ACCENT = '#FEA405';
const DEFAULT_AVATAR = require('../../assets/images/default_profile.jpg');

interface Errand {
  id: string;
  user_id: string;
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

export default function ErrandDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();

  const [errand, setErrand] = useState<Errand | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<any>(DEFAULT_AVATAR);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
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
      <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        <Header avatarUrl={avatarUrl} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <SkeletonLoading />
        </ScrollView>
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

  const isOwner = currentUserId === errand.user_id;

  const deadline = errand.deadline
    ? new Date(errand.deadline).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const postedOn = new Date(errand.created_at).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const images = errand.images ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <Header avatarUrl={avatarUrl} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ alignSelf: 'center', width: '100%', maxWidth: width >= 768 ? 680 : undefined, padding: 20, gap: 16 }}>

          <DetailHeader isRemote={errand.is_remote} />

          {isOwner && (
            <OwnerActions
              errandId={errand.id}
              isEditing={isEditing}
              onEditToggle={() => setIsEditing(e => !e)}
            />
          )}

          {isEditing ? (
            <EditErrandSheet
              errand={errand}
              onSaved={(updated) => {
                setErrand(prev => prev ? { ...prev, ...updated } : prev);
                setIsEditing(false);
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <DetailCard
              title={errand.title}
              description={errand.description}
              isOpen={errand.is_open}
              budget={errand.budget}
              deadline={deadline}
              locationName={errand.location_name}
              addressDetails={errand.address_details}
              locationLat={errand.location_lat}
              locationLng={errand.location_lng}
              images={images}
              onImagePress={setPreviewIndex}
            />
          )}

          <PosterCard
            name={errand.poster_name}
            avatar={errand.poster_avatar}
            rating={errand.poster_rating}
            isVerified={errand.poster_is_verified}
            postedOn={postedOn}
          />

          {errand.is_open && !isOwner && (
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

      <ImageLightbox
        images={images}
        activeIndex={previewIndex}
        onClose={() => setPreviewIndex(null)}
        onIndexChange={setPreviewIndex}
      />
    </View>
  );
}
