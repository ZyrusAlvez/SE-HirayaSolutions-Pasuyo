import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getErrand } from '@/controllers/errandController';
import type { Errand } from '@/controllers/errandController';
import { loadProfile } from '@/controllers/profileController';
import Header from '@/view/components/Header';
import NavBar from '@/view/components/NavBar';
import GuestHeader from '@/view/components/GuestHeader';
import DetailHeader from '@/view/presentation/errand/DetailHeader';
import DetailCard from '@/view/presentation/errand/DetailCard';
import PosterCard from '@/view/presentation/errand/PosterCard';
import OwnerActions from '@/view/presentation/errand/OwnerActions';
import EditErrandSheet from '@/view/presentation/errand/EditErrandSheet';
import SkeletonLoading from '@/view/presentation/errand/SkeletonLoading';
import ImageLightbox from '@/view/presentation/errand/ImageLightbox';

const ACCENT = '#FEA405';
const DEFAULT_AVATAR = require('../../assets/images/default_profile.jpg');

export default function ErrandDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const router = useRouter();

  const [errand, setErrand] = useState<Errand | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<any>(DEFAULT_AVATAR);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    loadProfile().then((result) => {
      if (result.success && result.data) {
        setCurrentUserId(result.data.id);
        if (result.data.avatarUrl) setAvatarUrl({ uri: result.data.avatarUrl });
        setIsVerified(result.data.verificationStatus === 'verified');
      } else {
        setIsGuest(true);
      }
    });
  }, []);

  useEffect(() => {
    getErrand(id).then((result) => {
      if (result.success) setErrand(result.data);
      setLoading(false);
    });
  }, [id]);

  const headerEl = isGuest ? <GuestHeader /> : <Header avatarUrl={avatarUrl} isVerified={isVerified} />;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        {headerEl}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <SkeletonLoading />
        </ScrollView>
        {!isGuest && <NavBar />}
      </View>
    );
  }

  if (!errand) {
    return (
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        {headerEl}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="alert-circle-outline" size={48} color="#E5E7EB" />
          <Text style={{ color: '#9CA3AF', marginTop: 8 }}>Errand not found</Text>
        </View>
        {!isGuest && <NavBar />}
      </View>
    );
  }

  const isOwner = currentUserId === errand.user_id;
  const images = errand.images ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {headerEl}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ alignSelf: 'center', width: '100%', maxWidth: width >= 768 ? 680 : undefined, padding: 20, gap: 16 }}>

          <DetailHeader isRemote={errand.is_remote} errandId={errand.id} />

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
              status={errand.status}
              budget={errand.budget}
              deadline={errand.deadline ? new Date(errand.deadline).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : null}
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
            postedOn={new Date(errand.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
          />

          {errand.status === 'Available' && !isOwner && (
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => { if (isGuest) router.push(`/signup?redirect=/errand/${errand.id}`); }}
                style={{ flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: 'center', borderWidth: 2, borderColor: ACCENT }}
              >
                <Text style={{ color: '#111827', fontWeight: '700', fontSize: 14 }}>
                  Chat with {errand.poster_name ?? 'poster'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => { if (isGuest) router.push(`/signup?redirect=/errand/${errand.id}`); }}
                style={{ flex: 1, backgroundColor: ACCENT, borderRadius: 16, paddingVertical: 12, alignItems: 'center' }}
              >
                <Text style={{ color: 'white', fontWeight: '800', fontSize: 14 }}>Accept Errand</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </ScrollView>

      {!isGuest && <NavBar />}

      <ImageLightbox
        images={images}
        activeIndex={previewIndex}
        onClose={() => setPreviewIndex(null)}
        onIndexChange={setPreviewIndex}
      />
    </View>
  );
}
