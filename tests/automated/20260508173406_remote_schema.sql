create type "public"."account_status" as enum ('verified', 'unverified', 'pending', 'suspended');

create type "public"."admin_log_action" as enum ('SUSPENDED_USER', 'RESTORED_USER', 'APPROVED_VERIFICATION', 'REJECTED_VERIFICATION', 'APPROVED_PAYMENT', 'REJECTED_PAYMENT', 'DELETED_ERRAND');

create type "public"."errand_event_type" as enum ('posted', 'accepted', 'cancelled', 'marked_done', 'reviewed', 'edited_profile', 'edited_errand', 'deleted_errand');

create type "public"."service_fee_payment_status" as enum ('pending', 'approved', 'rejected');

drop view if exists "public"."admin_user_profiles";

drop view if exists "public"."conversations_with_profiles";

drop view if exists "public"."errands_with_profiles";


  create table "public"."activity_log" (
    "id" uuid not null default gen_random_uuid(),
    "errand_id" uuid,
    "actor_id" uuid not null,
    "event_type" public.errand_event_type not null,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."activity_log" enable row level security;


  create table "public"."service_fee_payments" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "amount" numeric(10,2) not null,
    "reference_no" text not null,
    "screenshot_url" text not null,
    "status" public.service_fee_payment_status not null default 'pending'::public.service_fee_payment_status,
    "admin_note" text,
    "created_at" timestamp with time zone not null default now(),
    "reviewed_at" timestamp with time zone,
    "reviewed_by" uuid
      );


alter table "public"."service_fee_payments" enable row level security;

alter table "public"."admin_logs" alter column "action" set data type public.admin_log_action using "action"::public.admin_log_action;

alter table "public"."profiles" drop column "is_active";

alter table "public"."profiles" drop column "pending_verification";

alter table "public"."profiles" drop column "verified";

alter table "public"."profiles" add column "status" public.account_status not null default 'unverified'::public.account_status;

alter table "public"."reports" drop column "status";

CREATE UNIQUE INDEX errand_events_pkey ON public.activity_log USING btree (id);

CREATE INDEX idx_activity_log_actor_id ON public.activity_log USING btree (actor_id);

CREATE INDEX idx_activity_log_errand_id ON public.activity_log USING btree (errand_id);

CREATE INDEX idx_service_fee_payments_user_id ON public.service_fee_payments USING btree (user_id);

CREATE UNIQUE INDEX service_fee_payments_pkey ON public.service_fee_payments USING btree (id);

alter table "public"."activity_log" add constraint "errand_events_pkey" PRIMARY KEY using index "errand_events_pkey";

alter table "public"."service_fee_payments" add constraint "service_fee_payments_pkey" PRIMARY KEY using index "service_fee_payments_pkey";

alter table "public"."activity_log" add constraint "activity_log_errand_id_fkey" FOREIGN KEY (errand_id) REFERENCES public.errands(id) ON DELETE SET NULL not valid;

alter table "public"."activity_log" validate constraint "activity_log_errand_id_fkey";

alter table "public"."activity_log" add constraint "errand_events_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."activity_log" validate constraint "errand_events_actor_id_fkey";

alter table "public"."service_fee_payments" add constraint "service_fee_payments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."service_fee_payments" validate constraint "service_fee_payments_user_id_fkey";

set check_function_bodies = off;

create or replace view "public"."admin_user_profiles" as  SELECT au.id,
    au.email,
    COALESCE(((p.first_name || ' '::text) || p.last_name), (au.raw_user_meta_data ->> 'name'::text)) AS display_name,
    au.created_at,
    au.last_sign_in_at,
    p.status,
    p.role,
    p.rating,
    p.avatar_url,
    p.verification_submitted_at,
    p.id_type
   FROM (auth.users au
     LEFT JOIN public.profiles p ON ((au.id = p.id)));


CREATE OR REPLACE FUNCTION public.check_email_exists(email_input text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  select exists (
    select 1 from auth.users where email = email_input
  );
$function$
;

create or replace view "public"."conversations_with_profiles" as  SELECT c.id,
    c.user1_id,
    c.user2_id,
    c.last_message_at,
    c.last_message,
    c.last_message_sender_id,
    c.last_message_is_read,
    c.created_at,
    COALESCE(((p1.first_name || ' '::text) || p1.last_name), (u1.raw_user_meta_data ->> 'name'::text), 'Unknown'::text) AS user1_name,
    COALESCE(p1.avatar_url, (u1.raw_user_meta_data ->> 'custom_avatar_url'::text), (u1.raw_user_meta_data ->> 'avatar_url'::text)) AS user1_avatar,
    (p1.status = 'verified'::public.account_status) AS user1_verified,
    COALESCE(((p2.first_name || ' '::text) || p2.last_name), (u2.raw_user_meta_data ->> 'name'::text), 'Unknown'::text) AS user2_name,
    COALESCE(p2.avatar_url, (u2.raw_user_meta_data ->> 'custom_avatar_url'::text), (u2.raw_user_meta_data ->> 'avatar_url'::text)) AS user2_avatar,
    (p2.status = 'verified'::public.account_status) AS user2_verified
   FROM ((((public.conversations c
     LEFT JOIN public.profiles p1 ON ((p1.id = c.user1_id)))
     LEFT JOIN public.profiles p2 ON ((p2.id = c.user2_id)))
     LEFT JOIN auth.users u1 ON ((u1.id = c.user1_id)))
     LEFT JOIN auth.users u2 ON ((u2.id = c.user2_id)));


create or replace view "public"."errands_with_profiles" as  SELECT e.id,
    e.user_id,
    e.title,
    e.description,
    e.is_remote,
    e.status,
    e.accepted_by,
    e.location_lat,
    e.location_lng,
    e.location_name,
    e.address_details,
    e.budget,
    e.deadline,
    e.images,
    e.created_at,
        CASE
            WHEN (p.status = 'verified'::public.account_status) THEN TRIM(BOTH FROM ((COALESCE(p.first_name, ''::text) || ' '::text) || COALESCE(p.last_name, ''::text)))
            ELSE COALESCE(NULLIF((u.raw_user_meta_data ->> 'name'::text), ''::text), NULLIF((u.raw_user_meta_data ->> 'full_name'::text), ''::text))
        END AS poster_name,
    p.avatar_url AS poster_avatar,
    p.rating AS poster_rating,
    (p.status = 'verified'::public.account_status) AS poster_is_verified
   FROM ((public.errands e
     JOIN auth.users u ON ((u.id = e.user_id)))
     JOIN public.profiles p ON ((p.id = e.user_id)));


CREATE OR REPLACE FUNCTION public.get_admin_users()
 RETURNS TABLE(id uuid, email text, display_name text, created_at timestamp with time zone, last_sign_in_at timestamp with time zone, verified boolean, pending_verification boolean, role text, rating numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF (
    SELECT p.role FROM public.profiles p
    WHERE p.id = auth.uid()
  ) <> 'admin' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    v.id,
    v.email,
    v.display_name,
    v.created_at,
    v.last_sign_in_at,
    v.verified,
    v.pending_verification,
    v.role,
    v.rating
  FROM admin_user_profiles v;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_profile_avatar()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.profiles
  SET avatar_url = COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'custom_avatar_url', ''),
    NULLIF(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE conversations
  SET
    last_message = NEW.content,
    last_message_at = NEW.created_at,
    last_message_sender_id = NEW.sender_id,
    last_message_is_read = false
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."activity_log" to "anon";

grant insert on table "public"."activity_log" to "anon";

grant references on table "public"."activity_log" to "anon";

grant select on table "public"."activity_log" to "anon";

grant trigger on table "public"."activity_log" to "anon";

grant truncate on table "public"."activity_log" to "anon";

grant update on table "public"."activity_log" to "anon";

grant delete on table "public"."activity_log" to "authenticated";

grant insert on table "public"."activity_log" to "authenticated";

grant references on table "public"."activity_log" to "authenticated";

grant select on table "public"."activity_log" to "authenticated";

grant trigger on table "public"."activity_log" to "authenticated";

grant truncate on table "public"."activity_log" to "authenticated";

grant update on table "public"."activity_log" to "authenticated";

grant delete on table "public"."activity_log" to "service_role";

grant insert on table "public"."activity_log" to "service_role";

grant references on table "public"."activity_log" to "service_role";

grant select on table "public"."activity_log" to "service_role";

grant trigger on table "public"."activity_log" to "service_role";

grant truncate on table "public"."activity_log" to "service_role";

grant update on table "public"."activity_log" to "service_role";

grant delete on table "public"."service_fee_payments" to "anon";

grant insert on table "public"."service_fee_payments" to "anon";

grant references on table "public"."service_fee_payments" to "anon";

grant select on table "public"."service_fee_payments" to "anon";

grant trigger on table "public"."service_fee_payments" to "anon";

grant truncate on table "public"."service_fee_payments" to "anon";

grant update on table "public"."service_fee_payments" to "anon";

grant delete on table "public"."service_fee_payments" to "authenticated";

grant insert on table "public"."service_fee_payments" to "authenticated";

grant references on table "public"."service_fee_payments" to "authenticated";

grant select on table "public"."service_fee_payments" to "authenticated";

grant trigger on table "public"."service_fee_payments" to "authenticated";

grant truncate on table "public"."service_fee_payments" to "authenticated";

grant update on table "public"."service_fee_payments" to "authenticated";

grant delete on table "public"."service_fee_payments" to "service_role";

grant insert on table "public"."service_fee_payments" to "service_role";

grant references on table "public"."service_fee_payments" to "service_role";

grant select on table "public"."service_fee_payments" to "service_role";

grant trigger on table "public"."service_fee_payments" to "service_role";

grant truncate on table "public"."service_fee_payments" to "service_role";

grant update on table "public"."service_fee_payments" to "service_role";


  create policy "Users can insert own events"
  on "public"."activity_log"
  as permissive
  for insert
  to public
with check ((auth.uid() = actor_id));



  create policy "Users can read relevant events"
  on "public"."activity_log"
  as permissive
  for select
  to public
using (((auth.uid() = actor_id) OR ((metadata ->> 'reviewed_id'::text) = (auth.uid())::text) OR (EXISTS ( SELECT 1
   FROM public.errands
  WHERE ((errands.id = activity_log.errand_id) AND ((errands.user_id = auth.uid()) OR (errands.accepted_by = auth.uid())))))));



  create policy "Users can insert own payments"
  on "public"."service_fee_payments"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can read own payments"
  on "public"."service_fee_payments"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can read own receipts"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'service-fee-receipts'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can upload own receipts"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'service-fee-receipts'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



