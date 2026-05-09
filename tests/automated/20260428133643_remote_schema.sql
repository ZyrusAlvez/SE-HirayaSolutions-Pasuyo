


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."erand_status" AS ENUM (
    'Available',
    'Expired',
    'In Progress',
    'Completed'
);


ALTER TYPE "public"."erand_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_email_exists"("email_input" "text") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  select exists (
    select 1 from auth.users where email = email_input
  );
$$;


ALTER FUNCTION "public"."check_email_exists"("email_input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_users"() RETURNS TABLE("id" "uuid", "email" "text", "display_name" "text", "created_at" timestamp with time zone, "last_sign_in_at" timestamp with time zone, "verified" boolean, "pending_verification" boolean, "role" "text", "rating" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_admin_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_profile_avatar"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.profiles
  SET avatar_url = COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'custom_avatar_url', ''),
    NULLIF(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_profile_avatar"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_conversation_last_message"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."update_conversation_last_message"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid",
    "action" "text" NOT NULL,
    "target_user_id" "uuid",
    "details" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "verified" boolean DEFAULT false,
    "rating" numeric DEFAULT '0'::numeric,
    "role" "text" DEFAULT 'user'::"text",
    "pending_verification" boolean DEFAULT false,
    "first_name" "text",
    "middle_name" "text",
    "last_name" "text",
    "suffix" "text",
    "gender" "text",
    "date_of_birth" "date",
    "address_province" "text",
    "address_city" "text",
    "address_barangay" "text",
    "address_street" "text",
    "address_house_no" "text",
    "address_building" "text",
    "address_unit" "text",
    "address_floor" "text",
    "address_block_lot" "text",
    "address_phase_subdivision" "text",
    "address_type" "text",
    "utility_bill_type" "text",
    "utility_bill_front_url" "text",
    "utility_bill_back_url" "text",
    "id_type" "text",
    "id_front_url" "text",
    "id_back_url" "text",
    "verification_submitted_at" timestamp with time zone,
    "avatar_url" "text",
    "is_active" boolean DEFAULT true,
    "last_seen" timestamp with time zone
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'User profile information aligned with the auth table';



COMMENT ON COLUMN "public"."profiles"."pending_verification" IS 'will be true if the user request to be verified and be false once granted/rejected';



COMMENT ON COLUMN "public"."profiles"."is_active" IS 'states if the account is suspended or not';



CREATE OR REPLACE VIEW "public"."admin_user_profiles" WITH ("security_invoker"='on') AS
 SELECT "au"."id",
    "au"."email",
    COALESCE((("p"."first_name" || ' '::"text") || "p"."last_name"), ("au"."raw_user_meta_data" ->> 'name'::"text")) AS "display_name",
    "au"."created_at",
    "au"."last_sign_in_at",
    "p"."verified",
    "p"."pending_verification",
    "p"."role",
    "p"."rating",
    "p"."avatar_url",
    "p"."verification_submitted_at",
    "p"."id_type"
   FROM ("auth"."users" "au"
     LEFT JOIN "public"."profiles" "p" ON (("au"."id" = "p"."id")));


ALTER VIEW "public"."admin_user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user1_id" "uuid" NOT NULL,
    "user2_id" "uuid" NOT NULL,
    "last_message_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_message_is_read" boolean DEFAULT true,
    "last_message" "text",
    "last_message_sender_id" "uuid"
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."conversations_with_profiles" AS
 SELECT "c"."id",
    "c"."user1_id",
    "c"."user2_id",
    "c"."last_message_at",
    "c"."last_message",
    "c"."last_message_sender_id",
    "c"."last_message_is_read",
    "c"."created_at",
    COALESCE((("p1"."first_name" || ' '::"text") || "p1"."last_name"), ("u1"."raw_user_meta_data" ->> 'name'::"text"), 'Unknown'::"text") AS "user1_name",
    COALESCE("p1"."avatar_url", ("u1"."raw_user_meta_data" ->> 'custom_avatar_url'::"text"), ("u1"."raw_user_meta_data" ->> 'avatar_url'::"text")) AS "user1_avatar",
    COALESCE("p1"."verified", false) AS "user1_verified",
    COALESCE((("p2"."first_name" || ' '::"text") || "p2"."last_name"), ("u2"."raw_user_meta_data" ->> 'name'::"text"), 'Unknown'::"text") AS "user2_name",
    COALESCE("p2"."avatar_url", ("u2"."raw_user_meta_data" ->> 'custom_avatar_url'::"text"), ("u2"."raw_user_meta_data" ->> 'avatar_url'::"text")) AS "user2_avatar",
    COALESCE("p2"."verified", false) AS "user2_verified"
   FROM (((("public"."conversations" "c"
     LEFT JOIN "public"."profiles" "p1" ON (("p1"."id" = "c"."user1_id")))
     LEFT JOIN "public"."profiles" "p2" ON (("p2"."id" = "c"."user2_id")))
     LEFT JOIN "auth"."users" "u1" ON (("u1"."id" = "c"."user1_id")))
     LEFT JOIN "auth"."users" "u2" ON (("u2"."id" = "c"."user2_id")));


ALTER VIEW "public"."conversations_with_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."errand_cancellations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "errand_id" "uuid" NOT NULL,
    "cancelled_by" "uuid" NOT NULL,
    "reason" "text" NOT NULL,
    "details" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."errand_cancellations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."errand_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "errand_id" "uuid" NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "reviewed_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "feedback" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "errand_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."errand_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."errands" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "is_remote" boolean DEFAULT false NOT NULL,
    "location_lat" double precision,
    "location_lng" double precision,
    "location_name" "text",
    "budget" numeric(10,2),
    "deadline" timestamp with time zone,
    "images" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "address_details" "text",
    "is_open" boolean DEFAULT true,
    "status" "public"."erand_status" DEFAULT 'Available'::"public"."erand_status" NOT NULL,
    "accepted_by" "uuid"
);


ALTER TABLE "public"."errands" OWNER TO "postgres";


COMMENT ON COLUMN "public"."errands"."is_open" IS 'refers to the availability of the errand to be applied by runners';



CREATE OR REPLACE VIEW "public"."errands_with_profiles" AS
 SELECT "e"."id",
    "e"."user_id",
    "e"."title",
    "e"."description",
    "e"."is_remote",
    "e"."status",
    "e"."accepted_by",
    "e"."location_lat",
    "e"."location_lng",
    "e"."location_name",
    "e"."address_details",
    "e"."budget",
    "e"."deadline",
    "e"."images",
    "e"."created_at",
        CASE
            WHEN "p"."verified" THEN TRIM(BOTH FROM ((COALESCE("p"."first_name", ''::"text") || ' '::"text") || COALESCE("p"."last_name", ''::"text")))
            ELSE COALESCE(NULLIF(("u"."raw_user_meta_data" ->> 'name'::"text"), ''::"text"), NULLIF(("u"."raw_user_meta_data" ->> 'full_name'::"text"), ''::"text"))
        END AS "poster_name",
    "p"."avatar_url" AS "poster_avatar",
    "p"."rating" AS "poster_rating",
    "p"."verified" AS "poster_is_verified"
   FROM (("public"."errands" "e"
     JOIN "auth"."users" "u" ON (("u"."id" = "e"."user_id")))
     JOIN "public"."profiles" "p" ON (("p"."id" = "e"."user_id")));


ALTER VIEW "public"."errands_with_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender_id" "uuid",
    "content" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "file_url" "text",
    "file_name" "text",
    "file_type" "text"
);

ALTER TABLE ONLY "public"."messages" REPLICA IDENTITY FULL;


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "action" "text"
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON COLUMN "public"."notifications"."action" IS 'this refers to the url that once click, the user will be redirected to';



CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reporter_id" "uuid" NOT NULL,
    "reported_id" "uuid" NOT NULL,
    "type" "text" DEFAULT 'user'::"text" NOT NULL,
    "reason" "text" NOT NULL,
    "details" "text",
    "file_urls" "text"[],
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "errand_id" "text",
    CONSTRAINT "no_self_report" CHECK (("reporter_id" <> "reported_id"))
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_logs"
    ADD CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_user1_id_user2_id_key" UNIQUE ("user1_id", "user2_id");



ALTER TABLE ONLY "public"."errand_cancellations"
    ADD CONSTRAINT "errand_cancellations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."errand_reviews"
    ADD CONSTRAINT "errand_reviews_errand_id_reviewer_id_key" UNIQUE ("errand_id", "reviewer_id");



ALTER TABLE ONLY "public"."errand_reviews"
    ADD CONSTRAINT "errand_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."errands"
    ADD CONSTRAINT "errands_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_conversations_user1" ON "public"."conversations" USING "btree" ("user1_id");



CREATE INDEX "idx_conversations_user2" ON "public"."conversations" USING "btree" ("user2_id");



CREATE INDEX "idx_messages_conversation" ON "public"."messages" USING "btree" ("conversation_id", "created_at");



CREATE OR REPLACE TRIGGER "on_new_message_update_conversation" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_conversation_last_message"();



ALTER TABLE ONLY "public"."admin_logs"
    ADD CONSTRAINT "admin_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_logs"
    ADD CONSTRAINT "admin_logs_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."errand_cancellations"
    ADD CONSTRAINT "errand_cancellations_errand_id_fkey" FOREIGN KEY ("errand_id") REFERENCES "public"."errands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."errand_reviews"
    ADD CONSTRAINT "errand_reviews_errand_id_fkey" FOREIGN KEY ("errand_id") REFERENCES "public"."errands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."errands"
    ADD CONSTRAINT "errands_accepted_by_fkey" FOREIGN KEY ("accepted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."errands"
    ADD CONSTRAINT "errands_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reported_id_fkey" FOREIGN KEY ("reported_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Admins can select all profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can view all cancellations" ON "public"."errand_cancellations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Allow system messages" ON "public"."messages" FOR INSERT TO "authenticated" WITH CHECK ((("sender_id" IS NULL) OR ("auth"."uid"() = "sender_id")));



CREATE POLICY "Only admins can read logs" ON "public"."admin_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Runner can cancel accepted errand" ON "public"."errands" FOR UPDATE USING (("auth"."uid"() = "accepted_by")) WITH CHECK (true);



CREATE POLICY "Users can accept errands" ON "public"."errands" FOR UPDATE TO "authenticated" USING (("status" = 'Available'::"public"."erand_status")) WITH CHECK ((("accepted_by" = "auth"."uid"()) AND ("status" = 'In Progress'::"public"."erand_status")));



CREATE POLICY "Users can delete their own errands" ON "public"."errands" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert conversations they belong to" ON "public"."conversations" FOR INSERT WITH CHECK ((("auth"."uid"() = "user1_id") OR ("auth"."uid"() = "user2_id")));



CREATE POLICY "Users can insert own cancellations" ON "public"."errand_cancellations" FOR INSERT WITH CHECK (("auth"."uid"() = "cancelled_by"));



CREATE POLICY "Users can insert own reviews" ON "public"."errand_reviews" FOR INSERT WITH CHECK (("auth"."uid"() = "reviewer_id"));



CREATE POLICY "Users can insert their own errands" ON "public"."errands" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own reports" ON "public"."reports" FOR INSERT WITH CHECK (("auth"."uid"() = "reporter_id"));



CREATE POLICY "Users can read own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update messages in their conversations" ON "public"."messages" FOR UPDATE USING (("conversation_id" IN ( SELECT "conversations"."id"
   FROM "public"."conversations"
  WHERE (("auth"."uid"() = "conversations"."user1_id") OR ("auth"."uid"() = "conversations"."user2_id")))));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their conversations" ON "public"."conversations" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "user1_id") OR ("auth"."uid"() = "user2_id")));



CREATE POLICY "Users can update their own errands" ON "public"."errands" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own last_seen" ON "public"."profiles" FOR UPDATE USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Users can view all open errands" ON "public"."errands" FOR SELECT USING (true);



CREATE POLICY "Users can view own cancellations" ON "public"."errand_cancellations" FOR SELECT USING (("auth"."uid"() = "cancelled_by"));



CREATE POLICY "Users can view own reviews" ON "public"."errand_reviews" FOR SELECT USING ((("auth"."uid"() = "reviewer_id") OR ("auth"."uid"() = "reviewed_id")));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can view their own reports" ON "public"."reports" FOR SELECT USING (("auth"."uid"() = "reporter_id"));



CREATE POLICY "Users see messages in their conversations" ON "public"."messages" FOR SELECT USING ((("sender_id" = "auth"."uid"()) OR ("conversation_id" IN ( SELECT "conversations"."id"
   FROM "public"."conversations"
  WHERE (("conversations"."user1_id" = "auth"."uid"()) OR ("conversations"."user2_id" = "auth"."uid"()))))));



CREATE POLICY "Users see own conversations" ON "public"."conversations" FOR SELECT USING ((("auth"."uid"() = "user1_id") OR ("auth"."uid"() = "user2_id")));



CREATE POLICY "Users send messages in their conversations" ON "public"."messages" FOR INSERT WITH CHECK ((("auth"."uid"() = "sender_id") AND ("conversation_id" IN ( SELECT "conversations"."id"
   FROM "public"."conversations"
  WHERE (("auth"."uid"() = "conversations"."user1_id") OR ("auth"."uid"() = "conversations"."user2_id"))))));



ALTER TABLE "public"."admin_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."errand_cancellations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."errand_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."errands" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."messages";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."profiles";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."check_email_exists"("email_input" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_email_exists"("email_input" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_email_exists"("email_input" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_profile_avatar"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_profile_avatar"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_profile_avatar"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_conversation_last_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_conversation_last_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_conversation_last_message"() TO "service_role";


















GRANT ALL ON TABLE "public"."admin_logs" TO "anon";
GRANT ALL ON TABLE "public"."admin_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_logs" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."admin_user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."admin_user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."conversations_with_profiles" TO "anon";
GRANT ALL ON TABLE "public"."conversations_with_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations_with_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."errand_cancellations" TO "anon";
GRANT ALL ON TABLE "public"."errand_cancellations" TO "authenticated";
GRANT ALL ON TABLE "public"."errand_cancellations" TO "service_role";



GRANT ALL ON TABLE "public"."errand_reviews" TO "anon";
GRANT ALL ON TABLE "public"."errand_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."errand_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."errands" TO "anon";
GRANT ALL ON TABLE "public"."errands" TO "authenticated";
GRANT ALL ON TABLE "public"."errands" TO "service_role";



GRANT ALL ON TABLE "public"."errands_with_profiles" TO "anon";
GRANT ALL ON TABLE "public"."errands_with_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."errands_with_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop trigger if exists "on_new_message_update_conversation" on "public"."messages";

drop policy "Only admins can read logs" on "public"."admin_logs";

drop policy "Admins can view all cancellations" on "public"."errand_cancellations";

drop policy "Users can accept errands" on "public"."errands";

drop policy "Users can update messages in their conversations" on "public"."messages";

drop policy "Users see messages in their conversations" on "public"."messages";

drop policy "Users send messages in their conversations" on "public"."messages";

alter table "public"."errand_cancellations" drop constraint "errand_cancellations_errand_id_fkey";

alter table "public"."errand_reviews" drop constraint "errand_reviews_errand_id_fkey";

alter table "public"."messages" drop constraint "messages_conversation_id_fkey";

drop view if exists "public"."errands_with_profiles";

alter table "public"."errands" alter column "status" set default 'Available'::public.erand_status;

alter table "public"."errands" alter column "status" set data type public.erand_status using "status"::text::public.erand_status;

alter table "public"."errand_cancellations" add constraint "errand_cancellations_errand_id_fkey" FOREIGN KEY (errand_id) REFERENCES public.errands(id) ON DELETE CASCADE not valid;

alter table "public"."errand_cancellations" validate constraint "errand_cancellations_errand_id_fkey";

alter table "public"."errand_reviews" add constraint "errand_reviews_errand_id_fkey" FOREIGN KEY (errand_id) REFERENCES public.errands(id) ON DELETE CASCADE not valid;

alter table "public"."errand_reviews" validate constraint "errand_reviews_errand_id_fkey";

alter table "public"."messages" add constraint "messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_conversation_id_fkey";

create or replace view "public"."admin_user_profiles" as  SELECT au.id,
    au.email,
    COALESCE(((p.first_name || ' '::text) || p.last_name), (au.raw_user_meta_data ->> 'name'::text)) AS display_name,
    au.created_at,
    au.last_sign_in_at,
    p.verified,
    p.pending_verification,
    p.role,
    p.rating,
    p.avatar_url,
    p.verification_submitted_at,
    p.id_type
   FROM (auth.users au
     LEFT JOIN public.profiles p ON ((au.id = p.id)));


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
    COALESCE(p1.verified, false) AS user1_verified,
    COALESCE(((p2.first_name || ' '::text) || p2.last_name), (u2.raw_user_meta_data ->> 'name'::text), 'Unknown'::text) AS user2_name,
    COALESCE(p2.avatar_url, (u2.raw_user_meta_data ->> 'custom_avatar_url'::text), (u2.raw_user_meta_data ->> 'avatar_url'::text)) AS user2_avatar,
    COALESCE(p2.verified, false) AS user2_verified
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
            WHEN p.verified THEN TRIM(BOTH FROM ((COALESCE(p.first_name, ''::text) || ' '::text) || COALESCE(p.last_name, ''::text)))
            ELSE COALESCE(NULLIF((u.raw_user_meta_data ->> 'name'::text), ''::text), NULLIF((u.raw_user_meta_data ->> 'full_name'::text), ''::text))
        END AS poster_name,
    p.avatar_url AS poster_avatar,
    p.rating AS poster_rating,
    p.verified AS poster_is_verified
   FROM ((public.errands e
     JOIN auth.users u ON ((u.id = e.user_id)))
     JOIN public.profiles p ON ((p.id = e.user_id)));



  create policy "Only admins can read logs"
  on "public"."admin_logs"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Admins can view all cancellations"
  on "public"."errand_cancellations"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Users can accept errands"
  on "public"."errands"
  as permissive
  for update
  to authenticated
using ((status = 'Available'::public.erand_status))
with check (((accepted_by = auth.uid()) AND (status = 'In Progress'::public.erand_status)));



  create policy "Users can update messages in their conversations"
  on "public"."messages"
  as permissive
  for update
  to public
using ((conversation_id IN ( SELECT conversations.id
   FROM public.conversations
  WHERE ((auth.uid() = conversations.user1_id) OR (auth.uid() = conversations.user2_id)))));



  create policy "Users see messages in their conversations"
  on "public"."messages"
  as permissive
  for select
  to public
using (((sender_id = auth.uid()) OR (conversation_id IN ( SELECT conversations.id
   FROM public.conversations
  WHERE ((conversations.user1_id = auth.uid()) OR (conversations.user2_id = auth.uid()))))));



  create policy "Users send messages in their conversations"
  on "public"."messages"
  as permissive
  for insert
  to public
with check (((auth.uid() = sender_id) AND (conversation_id IN ( SELECT conversations.id
   FROM public.conversations
  WHERE ((auth.uid() = conversations.user1_id) OR (auth.uid() = conversations.user2_id))))));


CREATE TRIGGER on_new_message_update_conversation AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_updated AFTER UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION public.sync_profile_avatar();


  create policy "Anyone can view chat files"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'chat-files'::text));



  create policy "Anyone can view errand images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'errand-images'::text));



  create policy "Authenticated users can upload chat files"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'chat-files'::text));



  create policy "Authenticated users can upload errand images"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'errand-images'::text) AND (auth.role() = 'authenticated'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Authenticated users can upload report files"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'report-files'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Avatars are publicly readable 1oj01fe_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "Public read access for report files"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'report-files'::text));



  create policy "Users can delete their own errand images"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'errand-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can read their own verification docs"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'verifications'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can update their own verification docs"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'verifications'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can upload avata 1oj01fe_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'avatars'::text));



  create policy "Users can upload avata 1oj01fe_1"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'avatars'::text));



  create policy "Users can upload avata 1oj01fe_2"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'avatars'::text));



  create policy "Users can upload their own avatar 1oj01fe_1"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can upload their own verification docs"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'verifications'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('verifications', 'verifications', true),
  ('errand-images', 'errand-images', true),
  ('chat-files', 'chat-files', true),
  ('report-files', 'report-files', true)
ON CONFLICT (id) DO NOTHING;


