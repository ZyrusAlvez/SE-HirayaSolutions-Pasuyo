import { supabase, supabaseAdmin } from '@/utils/supabase';

const PRESENCE_CHANNEL = 'user-online-status';
const PING_INTERVAL = 30000; // 30s - just a fallback heartbeat, not primary detection
const OFFLINE_THRESHOLD = 60000; // 60s fallback for crash/network loss

let pingTimer: ReturnType<typeof setInterval> | null = null;
let channel: any = null;
let currentUserId: string | null = null;
let onChangeCallback: ((onlineIds: string[]) => void) | null = null;
const lastPings: Record<string, number> = {};

export const joinPresence = (userId: string, onPresenceChange?: (onlineIds: string[]) => void) => {
  currentUserId = userId;
  onChangeCallback = onPresenceChange ?? null;

  channel = supabase.channel(PRESENCE_CHANNEL);
  channel
    .on('broadcast', { event: 'ping' }, (payload: any) => {
      const senderId = payload.payload?.userId;
      if (senderId) {
        lastPings[senderId] = Date.now();
        recalcOnline();
      }
    })
    .on('broadcast', { event: 'goodbye' }, (payload: any) => {
      const senderId = payload.payload?.userId;
      if (senderId) {
        delete lastPings[senderId];
        recalcOnline();
      }
    })
    .subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        sendPing(userId);
        pingTimer = setInterval(() => sendPing(userId), PING_INTERVAL);
      }
    });

  // Update last_seen in DB every 60s
  updateLastSeen(userId);
  const dbTimer = setInterval(() => updateLastSeen(userId), 60000);
  (channel as any)._dbTimer = dbTimer;

  // Fallback: check for stale users every 30s
  const staleTimer = setInterval(() => recalcOnline(), PING_INTERVAL);
  (channel as any)._staleTimer = staleTimer;

  return channel;
};

const sendPing = (userId: string) => {
  channel?.send({ type: 'broadcast', event: 'ping', payload: { userId } });
};

export const sendGoodbye = () => {
  if (channel && currentUserId) {
    channel.send({ type: 'broadcast', event: 'goodbye', payload: { userId: currentUserId } });
  }
};

const recalcOnline = () => {
  const now = Date.now();
  const onlineIds = Object.entries(lastPings)
    .filter(([_, ts]) => now - ts < OFFLINE_THRESHOLD)
    .map(([id]) => id);
  onChangeCallback?.(onlineIds);
};

export const leavePresence = () => {
  sendGoodbye();
  if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
  if (channel) {
    if ((channel as any)._dbTimer) clearInterval((channel as any)._dbTimer);
    if ((channel as any)._staleTimer) clearInterval((channel as any)._staleTimer);
    supabase.removeChannel(channel);
    channel = null;
  }
  currentUserId = null;
  onChangeCallback = null;
  Object.keys(lastPings).forEach((k) => delete lastPings[k]);
};

export const updateLastSeen = async (userId: string) => {
  const { error } = await supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', userId);
  if (error) console.log('updateLastSeen error:', error);
};

export const getLastSeen = async (userId: string): Promise<string | null> => {
  const client = supabaseAdmin ?? supabase;
  const { data } = await client
    .from('profiles')
    .select('last_seen')
    .eq('id', userId)
    .single();
  return data?.last_seen ?? null;
};
