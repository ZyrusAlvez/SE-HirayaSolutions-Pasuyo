import { supabase } from '@/utils/supabase';

const PRESENCE_CHANNEL = 'online-users';
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let presenceChannel: any = null;

export const joinPresence = (userId: string, onPresenceChange?: (onlineIds: string[]) => void) => {
  presenceChannel = supabase.channel(PRESENCE_CHANNEL, { config: { presence: { key: userId } } });

  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState();
      const onlineIds = Object.keys(state);
      console.log('Presence sync:', onlineIds);
      onPresenceChange?.(onlineIds);
    })
    .subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        console.log('Presence SUBSCRIBED, tracking userId:', userId);
        await presenceChannel.track({ user_id: userId, online_at: new Date().toISOString() });
      }
    });

  // Start heartbeat to update last_seen
  updateLastSeen(userId);
  heartbeatTimer = setInterval(() => updateLastSeen(userId), HEARTBEAT_INTERVAL);

  return presenceChannel;
};

export const leavePresence = async () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  if (presenceChannel) {
    await presenceChannel.untrack();
    supabase.removeChannel(presenceChannel);
    presenceChannel = null;
  }
};

export const updateLastSeen = (userId: string) =>
  supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', userId);

export const getLastSeen = async (userId: string): Promise<string | null> => {
  const { data } = await supabase
    .from('profiles')
    .select('last_seen')
    .eq('id', userId)
    .single();
  return data?.last_seen ?? null;
};
