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
import ConfirmModal from '@/view/components/ConfirmModal';
import CancelErrandModal from '@/view/presentation/chat/CancelErrandModal';
import ErrandHistoryModal from '@/view/presentation/service-fee/ErrandHistoryModal';

const DEFAULT_AVATAR = require('@/assets/images/default_profile.jpg');

const STATUS_COLORS: Record<string, string> = {
  Available: '#10B981',
  'In Progress': '#F59E0B',
  Completed: '#10B981',
  Expired: '#EF4444',
  Cancelled: '#6B7280',
};

export default function ErrandRow({ errand, search = '', tab = 'posted', onDelete }: { errand: DashboardErrand; search?: string; tab?: string; onDelete?: () => void }) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showMarkDoneConfirm, setShowMarkDoneConfirm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
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
    { label: 'History', icon: 'time-outline', onPress: () => setShowHistory(true) },
    { label: 'Delete', icon: 'trash-outline', onPress: () => setShowDeleteConfirm(true) },
    { label: 'Share', icon: 'share-outline', onPress: handleShare },
  ];

  const canActOnAccepted = errand.status !== 'Cancelled' && errand.status !== 'Completed';

  const acceptedActions: KebabAction[] = [
    ...(canActOnAccepted ? [{ label: 'Mark as Done', icon: 'checkmark-circle-outline', onPress: () => setShowMarkDoneConfirm(true) }] : []),
    { label: `Chat with ${errand.poster_name ?? 'Client'}`, icon: 'chatbubble-outline', onPress: () => router.push(`/chat?userId=${errand.user_id}`) },
    { label: 'History', icon: 'time-outline', onPress: () => setShowHistory(true) },
    ...(canActOnAccepted ? [{ label: 'Cancel Errand', icon: 'close-circle-outline', onPress: () => setShowCancelModal(true) }] : []),
    { label: 'Share', icon: 'share-outline', onPress: handleShare },
  ];

  const actions = tab === 'posted' ? postedActions : acceptedActions;

  return (
    <TouchableOpacity
      testID={`errand-card-${errand.id}`}
      activeOpacity={0.7}
      onPress={() => router.push(`/errand/${errand.id}`)}
      style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}
    >
      {/* Avatar */}
      <Image source={avatar} style={{ width: 32, height: 32, borderRadius: 16 }} />

      {/* Content */}
      <View style={{ flex: 1, gap: 2 }}>
        <Text testID="errand-card-title" style={{ fontSize: 13, fontWeight: '700', color: '#111827' }} numberOfLines={1}>{errand.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 11, color: '#6B7280' }} numberOfLines={1}>{errand.poster_name ?? 'Unknown'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, height: 14, justifyContent: 'center' }}>
            <View style={{ width: 12, height: 12, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={errand.is_remote ? 'cloud-outline' : 'location-outline'} size={10} color="#9CA3AF" />
            </View>
            <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '500' }}>{errand.is_remote ? 'Remote' : 'Onsite'}</Text>
          </View>
          {errand.budget != null && (
            <Text style={{ fontSize: 10, fontWeight: '600', color: '#D97706' }}>₱{errand.budget.toLocaleString()}</Text>
          )}
        </View>
      </View>

      {/* Status + kebab */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ backgroundColor: color + '1A', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 }}>
          <Text testID="errand-card-status" style={{ fontSize: 10, fontWeight: '700', color }}>{errand.status}</Text>
        </View>
        <KebabMenu actions={actions} />
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
      <ErrandHistoryModal
        visible={showHistory}
        errandId={errand.id}
        errandTitle={errand.title}
        onClose={() => setShowHistory(false)}
        mode={tab === 'posted' ? 'full' : 'actor'}
      />
    </TouchableOpacity>
  );
}
