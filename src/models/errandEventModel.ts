import { supabase } from '@/utils/supabase';

export type ErrandEventType = 'accepted' | 'cancelled' | 'marked_done' | 'reviewed' | 'service_fee_paid';

export type ErrandEvent = {
  id: string;
  errand_id: string;
  actor_id: string;
  event_type: ErrandEventType;
  metadata: Record<string, any>;
  created_at: string;
};

export const insertErrandEvent = (
  errandId: string,
  actorId: string,
  eventType: ErrandEventType,
  metadata: Record<string, any> = {},
) =>
  supabase.from('errand_events').insert({
    errand_id: errandId,
    actor_id: actorId,
    event_type: eventType,
    metadata,
  });

export const getErrandEventsByActor = (errandId: string, actorId: string) =>
  supabase
    .from('errand_events')
    .select('*')
    .eq('errand_id', errandId)
    .or(`actor_id.eq.${actorId},metadata->>reviewed_id.eq.${actorId}`)
    .order('created_at', { ascending: true });

export const getErrandEvents = (errandId: string) =>
  supabase
    .from('errand_events')
    .select('*')
    .eq('errand_id', errandId)
    .order('created_at', { ascending: true });
