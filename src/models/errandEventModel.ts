import { supabase } from '@/utils/supabase';

export type ErrandEventType = 'posted' | 'accepted' | 'cancelled' | 'marked_done' | 'reviewed' | 'edited_errand' | 'deleted_errand';

export type ErrandEvent = {
  id: string;
  errand_id: string;
  actor_id: string;
  event_type: ErrandEventType;
  metadata: Record<string, any>;
  created_at: string;
};

export const insertErrandEvent = (
  errandId: string | null,
  actorId: string,
  eventType: ErrandEventType,
  metadata: Record<string, any> = {},
) =>
  supabase.from('activity_log').insert({
    errand_id: errandId,
    actor_id: actorId,
    event_type: eventType,
    metadata,
  });

export const getErrandEventsByActor = (errandId: string, actorId: string) =>
  supabase
    .from('activity_log')
    .select('*')
    .eq('errand_id', errandId)
    .or(`actor_id.eq.${actorId},metadata->>reviewed_id.eq.${actorId}`)
    .order('created_at', { ascending: true });

export const getErrandEvents = (errandId: string) =>
  supabase
    .from('activity_log')
    .select('*')
    .eq('errand_id', errandId)
    .order('created_at', { ascending: true });
