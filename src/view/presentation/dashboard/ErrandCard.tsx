import { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import type { DashboardErrand } from '@/controllers/errandController';
import { deleteErrand, cancelAcceptedErrand, markErrandAsDone } from '@/controllers/errandController';
import { toast } from '@/utils/toast';
import KebabMenu from '@/view/components/KebabMenu';
import type { KebabAction } from '@/view/components/KebabMenu';
import CancelErrandModal from '@/view/presentation/chat/CancelErrandModal';
import ConfirmModal from '@/view/components/ConfirmModal';

const DEFAULT_AVATAR = require('@/assets/images/default_profile.jpg');

const STATUS_COLORS: Record<string, string> = {
  Available: '#10B981',
  'In Progress': '#F59E0B',
  Completed: '#10B981',
  Expired: '#EF4444',
  Cancelled: '#6B7280',
};

export default function ErrandCard({ errand, search = '', tab = 'posted', onDelete }: { errand: DashboardErrand; search?: string; tab?: string; onDelete?: () => void }) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showMarkDoneConfirm, setShowMarkDoneConfirm] = useState(false);
  const color = STATUS_COLORS[errand.status] ?? '#6B7280';
  const avatar = errand.poster_avatar && errand.poster_avatar !== 'default'
    ? { uri: errand.poster_avatar }
    : DEFAULT_AVATAR;

  const handleShare = async () => {
    const url = Platform.OS === 'web'
      ? `${window.location.origin}/errand/${errand.id}`
      : `https://pasuyo.app/errand/${errand.id}`;
    await Clipboard.setStringAsync(url);
    toast({ title: 'Link copied to clipboard', preset: 'done' });
  };

  const postedActions: KebabAction[] = [
    { label: 'Edit', icon: 'create-outline', onPress: () => {
      if (errand.status === 'In Progress') { toast({ title: 'This errand has already been accepted and cannot be edited.', preset: 'error' }); return; }
      router.push(`/errand/${errand.id}?edit=true`);
    }},
    { label: 'Delete', icon: 'trash-outline', onPress: () => setShowDeleteConfirm(true) },
    { label: 'Share', icon: 'share-outline', onPress: handleShare },
  ];

  const canActOnAccepted = errand.status !== 'Cancelled' && errand.status !== 'Completed';

  const acceptedActions: KebabAction[] = [
    ...(canActOnAccepted ? [{ label: 'Mark as Done', icon: 'checkmark-circle-outline', onPress: () => setShowMarkDoneConfirm(true) }] : []),
    { label: `Chat with ${errand.poster_name ?? 'Client'}`, icon: 'chatbubble-outline', onPress: () => router.push(`/chat?userId=${errand.user_id}`) },
    ...(canActOnAccepted ? [{ label: 'Cancel Errand', icon: 'close-circle-outline', onPress: () => setShowCancelModal(true) }] : []),
    { label: 'Share', icon: 'share-outline', onPress: handleShare },
  ];

  const actions = tab === 'posted' ? postedActions : acceptedActions;

  return (
    <TouchableOpacity
      testID={`errand-card-${errand.id}`}
      activeOpacity={0.7}
      onPress={() => router.push(`/errand/${errand.id}`)}
      style={{
        backgroundColor: 'white', borderRadius: 14, padding: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
      }}>
      {/* Header: status + kebab */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <View style={{ backgroundColor: color + '1A', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color }}>{errand.status}</Text>
        </View>
        <KebabMenu actions={actions} />
      </View>

      {/* Title + description */}
      <Text testID="errand-card-title" style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 }} numberOfLines={1}>{errand.title}</Text>
      <Text testID="errand-card-description" style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 17 }} numberOfLines={2}>{errand.description}</Text>

      {/* Meta: type + budget */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, height: 16, justifyContent: 'center' }}>
          <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={errand.is_remote ? 'cloud-outline' : 'location-outline'} size={12} color="#9CA3AF" />
          </View>
          <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '500' }}>{errand.is_remote ? 'Remote' : 'Onsite'}</Text>
        </View>
        {errand.budget != null && (
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#D97706' }}>₱{errand.budget.toLocaleString()}</Text>
        )}
      </View>

      {/* Footer: poster */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
        <Image source={avatar} style={{ width: 20, height: 20, borderRadius: 10 }} />
        <Text style={{ fontSize: 11, fontWeight: '500', color: '#6B7280' }} numberOfLines={1}>{errand.poster_name ?? 'Unknown'}</Text>
      </View>

      <ConfirmModal
        visible={showDeleteConfirm}
        title="Delete Errand"
        message="Are you sure you want to delete this errand? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          setShowDeleteConfirm(false);
          const result = await deleteErrand(errand.id, errand.status);
          if (!result.success) { toast({ title: result.error, preset: 'error' }); return; }
          toast({ title: 'Errand deleted.', preset: 'done' });
          onDelete?.();
        }}
      />
      <ConfirmModal
        visible={showMarkDoneConfirm}
        title="Mark as Done"
        message={`Mark "${errand.title}" as completed?`}
        confirmLabel="Mark Done"
        onCancel={() => setShowMarkDoneConfirm(false)}
        onConfirm={async () => {
          setShowMarkDoneConfirm(false);
          const result = await markErrandAsDone(errand.id, errand.user_id, errand.title);
          if (!result.success) { toast({ title: result.error, preset: 'error' }); return; }
          toast({ title: 'Errand marked as done!', preset: 'done' });
          onDelete?.();
        }}
      />
      <CancelErrandModal
        visible={showCancelModal}
        errandTitle={errand.title}
        onClose={() => setShowCancelModal(false)}
        onConfirm={async (reason, details) => {
          const result = await cancelAcceptedErrand(errand.id, errand.user_id, errand.title, reason, details);
          if (!result.success) { toast({ title: result.error, preset: 'error' }); return; }
          toast({ title: 'Errand cancelled.', preset: 'done' });
          setShowCancelModal(false);
          onDelete?.();
        }}
      />
    </TouchableOpacity>
  );
}
