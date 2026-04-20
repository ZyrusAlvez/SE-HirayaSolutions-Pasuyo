import { supabase, supabaseAdmin } from '@/utils/supabase';

const PRESENCE_CHANNEL = 'user-online-status';
const PING_INTERVAL = 30000;
const OFFLINE_THRESHOLD = 60000;

let pingTimer: ReturnType<typeof setInterval> | null = null;
let staleTimer: ReturnType<typeof setInterval> | null = null;
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

  staleTimer = setInterval(() => recalcOnline(), PING_INTERVAL);
  return channel;
};

const sendPing = (userId: string) => {
  channel?.send({ type: 'broadcast', event: 'ping', payload: { userId } });
};

export const sendGoodbye = () => {
  if (channel && currentUserId) {
    channel.send({ type: 'broadcast', event: 'goodbye', payload: { userId: currentUserId } });
    updateLastSeenSync(currentUserId);
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
  if (staleTimer) { clearInterval(staleTimer); staleTimer = null; }
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
  currentUserId = null;
  onChangeCallback = null;
  Object.keys(lastPings).forEach((k) => delete lastPings[k]);
};

const updateLastSeenSync = (userId: string) => {
  const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`;
  const body = JSON.stringify({ last_seen: new Date().toISOString() });
  const serviceKey = process.env.EXPO_PUBLIC_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  try {
    fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'return=minimal',
      },
      body,
      keepalive: true,
    });
  } catch {}
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
