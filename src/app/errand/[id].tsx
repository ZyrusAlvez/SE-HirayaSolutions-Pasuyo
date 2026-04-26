import { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getErrand, acceptErrand } from '@/controllers/errandController';
import type { Errand } from '@/controllers/errandController';
import { getProfile } from '@/controllers/profileController';
import Header from '@/view/components/Header';
import NavBar from '@/view/components/NavBar';
import GuestHeader from '@/view/components/GuestHeader';
import DetailHeader from '@/view/presentation/errand/DetailHeader';
import DetailCard from '@/view/presentation/errand/DetailCard';
import PosterCard from '@/view/presentation/errand/PosterCard';
import OwnerActions from '@/view/presentation/errand/OwnerActions';
import EditErrandSheet from '@/view/presentation/errand/EditErrandSheet';
import SkeletonLoading from '@/view/presentation/errand/SkeletonLoading';
import ImageViewer from '@/view/components/ImageViewer';
import { toast } from '@/utils/toast';

const ACCENT = '#FEA405';
const DEFAULT_AVATAR = require('../../assets/images/default_profile.jpg');

export default function ErrandDetailScreen() {
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
  const { width } = useWindowDimensions();
  const router = useRouter();

  const [errand, setErrand] = useState<Errand | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<any>(DEFAULT_AVATAR);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(edit === 'true');
  const [isGuest, setIsGuest] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const acceptingRef = useRef(false);

  useEffect(() => {
    getProfile().then((result) => {
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

  const headerEl = isGuest ? <GuestHeader /> : <Header avatarUrl={avatarUrl} verificationStatus={isVerified ? 'verified' : 'not_verified'} />;

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
              status={errand.status}
              isEditing={isEditing}
              onEditToggle={() => setIsEditing(e => !e)}
            />
          )}

          {isEditing && isOwner ? (
            <EditErrandSheet
              errand={errand}
              onSaved={(updated) => {
                setErrand(prev => prev ? { ...prev, ...updated } as Errand : prev);
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
            userId={errand.user_id}
            name={errand.poster_name}
            avatar={errand.poster_avatar}
            rating={undefined}
            isVerified={errand.poster_is_verified}
            postedOn={new Date(errand.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
          />

          {!isOwner && (
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  if (isGuest) router.push(`/signup?redirect=/errand/${errand.id}`);
                  else router.push(`/chat?userId=${errand.user_id}`);
                }}
                style={{ flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: 'center', borderWidth: 2, borderColor: ACCENT }}
              >
                <Text style={{ color: '#111827', fontWeight: '700', fontSize: 14 }}>
                  Chat with {errand.poster_name ?? 'poster'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={accepting}
                onPress={async () => {
                  if (isGuest) { router.push(`/signup?redirect=/errand/${errand.id}`); return; }
                  if (acceptingRef.current) return;
                  acceptingRef.current = true;
                  setAccepting(true);
                  const result = await acceptErrand(errand.id, errand.status, errand.user_id, {
                    title: errand.title,
                    description: errand.description,
                    budget: errand.budget,
                  });
                  if (!result.success) { toast({ title: result.error, preset: 'error' }); setAccepting(false); return; }
                  toast({ title: 'Errand accepted!', preset: 'done' });
                  setErrand(prev => prev ? { ...prev, status: 'In Progress' as const, accepted_by: currentUserId } : prev);
                  router.push(`/chat?userId=${errand.user_id}`);
                }}
                style={{ flex: 1, backgroundColor: ACCENT, borderRadius: 16, paddingVertical: 12, alignItems: 'center', opacity: accepting ? 0.6 : 1 }}
              >
                <Text style={{ color: 'white', fontWeight: '800', fontSize: 14 }}>{accepting ? 'Accepting...' : 'Accept Errand'}</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </ScrollView>

      {!isGuest && <NavBar />}

      <ImageViewer
        images={images}
        activeIndex={previewIndex}
        onClose={() => setPreviewIndex(null)}
        onIndexChange={setPreviewIndex}
      />
    </View>
  );
}
