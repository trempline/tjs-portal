--
-- PostgreSQL database dump
--

\restrict MXWL0rvfK7KgSZYQcPUx0Nr7DZFzwQ5e4aJzcx4JXNYAtpsCZVErZSDxSJVtzUa

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.9 (Debian 17.9-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: add_policy(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_policy(p_table text) RETURNS TABLE(id integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    rec RECORD;   -- record variable for looping policies
BEGIN
    -- Enable RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', p_table);

    -- Drop ALL existing policies on the table
    FOR rec IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = p_table
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', rec.policyname, p_table);
    END LOOP;

    -- Create OPEN policies (public)
    EXECUTE format('
        CREATE POLICY "public select"
        ON %I FOR SELECT TO public USING (true);
    ', p_table);

    EXECUTE format('
        CREATE POLICY "public insert"
        ON %I FOR INSERT TO public WITH CHECK (true);
    ', p_table);

    EXECUTE format('
        CREATE POLICY "public update"
        ON %I FOR UPDATE TO public USING (true) WITH CHECK (true);
    ', p_table);

    EXECUTE format('
        CREATE POLICY "public delete"
        ON %I FOR DELETE TO public USING (true);
    ', p_table);

    RETURN QUERY SELECT 1 AS id;
END;
$$;


--
-- Name: can_invite_users(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_invite_users(user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tjs_user_roles ur
        JOIN tjs_roles r ON ur.role_id = r.id
        WHERE ur.user_id = user_id
        AND ur.is_active = TRUE
        AND r.name IN ('Admin', 'Committee Member')
    );
END;
$$;


--
-- Name: fx_update_email(text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fx_update_email(p_email text, p_id_artists integer) RETURNS TABLE(is_updated boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
    v_id_profile uuid;
begin
    select a.id_profile into v_id_profile
    from public.artists a
    where a.id = p_id_artists;

    if v_id_profile is null then
        return query select false;
        return;
    end if;

    update public.user_profile
    set email = p_email
    where id_user = v_id_profile;

    update auth.users
    set email = p_email
    where id = v_id_profile;

    return query select true;
end;
$$;


--
-- Name: get_artist_full_details(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_artist_full_details(p_id_artist integer) RETURNS json
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'id', a.id,
        'fname', a.fname,
        'lname', a.lname,
        'photo', a.photo,
        'credit_photo', a.credit_photo,
        'cover', a.cover,
        'credit_cover', a.credit_cover,
        'title', a.title,
        'long_bio', a.long_bio,

        -- 🎵 Instruments
        'instruments', (
          SELECT json_agg(
            json_build_object(
              'id', si.id,
              'name', si.name
            )
          )
          FROM artist_instruments ai
          JOIN sys_instruments si ON si.id = ai.id_instrument
          WHERE ai.id_artist = a.id
        ),

        -- 🎭 Performance types
        'performance_type', (
          SELECT json_agg(
            json_build_object(
              'id', sp.id,
              'name', sp.name
            )
          )
          FROM artist_performance ap
          JOIN sys_artist_performance sp ON sp.id = ap.id_performance
          WHERE ap.id_artist = a.id
        ),

        -- 🎓 Education
        'education', (
          SELECT json_agg(
            json_build_object(
              'course', ae.course,
              'school', ae.school,
              'year', ae.year
            )
            ORDER BY ae.year DESC
          )
          FROM artist_education ae
          WHERE ae.id_artist = a.id
        ),

        -- 🏆 Awards
        'awards', (
          SELECT json_agg(
            json_build_object(
              'award', aw.award,
              'description', aw.description,
              'year', aw.year
            )
            ORDER BY aw.year DESC
          )
          FROM artist_awards aw
          WHERE aw.id_artist = a.id
        ),

        -- 💿 Media
        'media', (
          SELECT json_agg(
            json_build_object(
              'media_type', smt.name,
              'id_media', am.id_media,
              'title', am.title,
              'image', am.image,
              'description', am.description,
              'url', am.url
            )
          )
          FROM artist_media am
          LEFT JOIN sys_media_type smt ON smt.id = am.id_media
          WHERE am.id_artist = a.id
        ),

        -- 🎤 Upcoming Events
        'upcoming_event', (
          SELECT json_agg(
            json_build_object(
              'id_event', e.id,
              'title', e.title,
              'location', l.name,
              'start_date', ed.start_date,
              'end_date', ed.end_date,
              'time', ed.time
            )
          )
          FROM events e
          INNER JOIN event_dates ed ON e.id = ed.id_event
          LEFT JOIN locations l ON ed.id_location = l.id
          WHERE e.id IN (
            SELECT id_event
            FROM event_artists
            WHERE id_artist = a.id
          )
          AND ed.end_date >= CURRENT_DATE
        )
      )
    )
    FROM artists a
    WHERE a.is_active = true
      AND a.id = p_id_artist
  );
END;
$$;


--
-- Name: get_artist_full_profile(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_artist_full_profile(artist_id uuid) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'artist', jsonb_build_object(
      'id', a.id,
      'id_profile', a.id_profile,
      'fname', a.fname,
      'lname', a.lname,
      'title', a.title,
      'teaser', a.teaser,
      'short_bio', a.short_bio,
      'long_bio', a.long_bio,
      'dob', a.dob,
      'pob', a.pob,
      'email', a.email,
      'phone', a.phone,
      'website', a.website,
      'address', a.address,
      'city', a.city,
      'country', a.country,
      'gender', a.gender,
      'photo', a.photo,
      'credit_photo', a.credit_photo,
      'cover', a.cover,
      'credit_cover', a.credit_cover,
      'is_featured', a.is_featured,
      'is_active', a.is_active,
      'created_on', a.created_on,
      'created_by', a.created_by,
      'last_update', a.last_update
    ),

    -- Education
    'education', COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', ae.id,
        'course', ae.course,
        'school', ae.school,
        'year', ae.year,
        'last_update', ae.last_updated
      )) FILTER (WHERE ae.id IS NOT NULL),
      '[]'::jsonb
    ),

    -- Awards
    'awards', COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', aw.id,
        'award', aw.award,
        'description', aw.description,
        'year', aw.year,
        'last_update', aw.last_updated
      )) FILTER (WHERE aw.id IS NOT NULL),
      '[]'::jsonb
    ),

    -- Instruments (now includes sys_instruments reference)
    'instruments', COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', ai.id,
        'id_instrument', ai.id_instrument,
        'instrument_name', si.name,
        'color', si.color,
        'created_on', ai.created_on
      )) FILTER (WHERE ai.id IS NOT NULL),
      '[]'::jsonb
    ),

    -- Media
    'media', COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', am.id,
        'id_media', am.id_media,
        'title', am.title,
        'image', am.image,
        'description', am.description,
        'url', am.url,
        'created_on', am.created_on
      )) FILTER (WHERE am.id IS NOT NULL),
      '[]'::jsonb
    ),

    -- Performance Types
    'performance_type', COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', sap.id,
        'name', sap.name,
        'last_update', sap.last_update
      )) FILTER (WHERE sap.id IS NOT NULL),
      '[]'::jsonb
    ),

    -- Availability
    'availability', COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', av.id,
        'start_date', av.start_date,
        'end_date', av.end_date,
        'notes', av.notes,
        'created_on', av.created_on,
        'last_updated', av.last_updated
      )) FILTER (WHERE av.id IS NOT NULL),
      '[]'::jsonb
    ),

    -- Requirements
    'requirements', COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', arq.id,
        'rib', arq.rib,
        'guso_nb', arq.guso_nb,
        'security_nb', arq.security_nb,
        'arlergies', arq.arlergies,
        'food_restriction', arq.food_restriction,
        'requirement', arq.requirement,
        'created_on', arq.created_on,
        'last_updated', arq.last_updated
      )) FILTER (WHERE arq.id IS NOT NULL),
      '[]'::jsonb
    ),

    -- Requests
    'requests', COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', ar.id,
        'title', ar.title,
        'short_desc', ar.short_desc,
        'long_desc', ar.long_desc,
        'status', ar.status,
        'comment', ar.comment,
        'created_on', ar.created_on,
        'last_update', ar.last_update,
        'media', (
          SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'id', arm.id,
            'id_media_type', arm.id_media_type,
            'title', arm.title,
            'image', arm.image,
            'description', arm.description,
            'url', arm.url
          )), '[]'::jsonb)
          FROM public.artist_request_media arm
          WHERE arm.id_request = ar.id
        )
      )) FILTER (WHERE ar.id IS NOT NULL),
      '[]'::jsonb
    )
  )
  INTO result
  FROM public.artists a
  LEFT JOIN public.artist_education ae ON ae.id_artist = a.id
  LEFT JOIN public.artist_awards aw ON aw.id_artist = a.id
  LEFT JOIN public.artist_instruments ai ON ai.id_artist = a.id
  LEFT JOIN public.sys_instruments si ON si.id = ai.id_instrument
  LEFT JOIN public.artist_media am ON am.id_artist = a.id
  LEFT JOIN public.artist_performance ap ON ap.id_artist = a.id
  LEFT JOIN public.sys_artist_performance sap ON sap.id = ap.id_performance
  LEFT JOIN public.artist_availability av ON av.id_artist = a.id
  LEFT JOIN public.artist_requirement arq ON arq.id_artist = a.id
  LEFT JOIN public.artist_request ar ON ar.id_artist = a.id
  WHERE a.id_profile IN (SELECT id FROM auth.users WHERE id = artist_id)
  GROUP BY a.id;

  RETURN result;
END;
$$;


--
-- Name: get_artist_full_profile_v1(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_artist_full_profile_v1(artist_id integer) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth'
    AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'artist', jsonb_build_object(
      'id', a.id,
      'id_profile', a.id_profile,
      'fname', a.fname,
      'lname', a.lname,
      'title', a.title,
      'teaser', a.teaser,
      'short_bio', a.short_bio,
      'long_bio', a.long_bio,
      'dob', a.dob,
      'pob', a.pob,
      'email', a.email,
      'phone', a.phone,
      'website', a.website,
      'address', a.address,
      'city', a.city,
      'country', a.country,
      'gender', a.gender,
      'photo', a.photo,
      'credit_photo', a.credit_photo,
      'cover', a.cover,
      'credit_cover', a.credit_cover,
      'is_featured', a.is_featured,
      'is_active', a.is_active,
      'created_on', a.created_on,
      'created_by', a.created_by,
      'last_update', a.last_update
    ),

    'education', COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', ae.id,
        'course', ae.course,
        'school', ae.school,
        'year', ae.year,
        'last_update', ae.last_updated
      )) FILTER (WHERE ae.id IS NOT NULL),
      '[]'::jsonb
    ),

    'awards', COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', aw.id,
        'award', aw.award,
        'description', aw.description,
        'year', aw.year,
        'last_update', aw.last_updated
      )) FILTER (WHERE aw.id IS NOT NULL),
      '[]'::jsonb
    ),

    'instruments', COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', ai.id,
        'id_instrument', ai.id_instrument,
        'instrument_name', si.name,
        'color', si.color,
        'created_on', ai.created_on
      )) FILTER (WHERE ai.id IS NOT NULL),
      '[]'::jsonb
    ),

    'media', COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', am.id,
        'id_media', am.id_media,
        'title', am.title,
        'image', am.image,
        'description', am.description,
        'url', am.url,
        'created_on', am.created_on
      )) FILTER (WHERE am.id IS NOT NULL),
      '[]'::jsonb
    ),

    'performance_type', COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', sap.id,
        'name', sap.name,
        'last_update', sap.last_update
      )) FILTER (WHERE sap.id IS NOT NULL),
      '[]'::jsonb
    ),

    'availability', COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', av.id,
        'start_date', av.start_date,
        'end_date', av.end_date,
        'notes', av.notes,
        'created_on', av.created_on,
        'last_updated', av.last_updated
      )) FILTER (WHERE av.id IS NOT NULL),
      '[]'::jsonb
    ),

    'requirements', COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', arq.id,
        'rib', arq.rib,
        'guso_nb', arq.guso_nb,
        'security_nb', arq.security_nb,
        'arlergies', arq.arlergies,
        'food_restriction', arq.food_restriction,
        'requirement', arq.requirement,
        'created_on', arq.created_on,
        'last_updated', arq.last_updated
      )) FILTER (WHERE arq.id IS NOT NULL),
      '[]'::jsonb
    ),

    'requests', COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', ar.id,
        'title', ar.title,
        'short_desc', ar.short_desc,
        'long_desc', ar.long_desc,
        'status', ar.status,
        'comment', ar.comment,
        'created_on', ar.created_on,
        'last_update', ar.last_update,
        'media', (
          SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'id', arm.id,
            'id_media_type', arm.id_media_type,
            'title', arm.title,
            'image', arm.image,
            'description', arm.description,
            'url', arm.url
          )), '[]'::jsonb)
          FROM public.artist_request_media arm
          WHERE arm.id_request = ar.id
        )
      )) FILTER (WHERE ar.id IS NOT NULL),
      '[]'::jsonb
    )
  )
  INTO result
  FROM public.artists a
  LEFT JOIN public.artist_education ae ON ae.id_artist = a.id
  LEFT JOIN public.artist_awards aw ON aw.id_artist = a.id
  LEFT JOIN public.artist_instruments ai ON ai.id_artist = a.id
  LEFT JOIN public.sys_instruments si ON si.id = ai.id_instrument
  LEFT JOIN public.artist_media am ON am.id_artist = a.id
  LEFT JOIN public.artist_performance ap ON ap.id_artist = a.id
  LEFT JOIN public.sys_artist_performance sap ON sap.id = ap.id_performance
  LEFT JOIN public.artist_availability av ON av.id_artist = a.id
  LEFT JOIN public.artist_requirement arq ON arq.id_artist = a.id
  LEFT JOIN public.artist_request ar ON ar.id_artist = a.id
  WHERE a.id = artist_id
  GROUP BY a.id;

  RETURN result;
END;
$$;


--
-- Name: get_artist_full_profile_v2(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_artist_full_profile_v2(artist_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth'
    AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'artist', jsonb_build_object(
      'id', a.id,
      'id_profile', a.id_profile,
      'fname', a.fname,
      'lname', a.lname,
      'title', a.title,
      'teaser', a.teaser,
      'short_bio', a.short_bio,
      'long_bio', a.long_bio,
      'dob', a.dob,
      'pob', a.pob,
      'email', a.email,
      'phone', a.phone,
      'website', a.website,
      'address', a.address,
      'city', a.city,
      'country', a.country,
      'gender', a.gender,
      'photo', a.photo,
      'credit_photo', a.credit_photo,
      'cover', a.cover,
      'credit_cover', a.credit_cover,
      'is_featured', a.is_featured,
      'is_active', a.is_active,
      'created_on', a.created_on,
      'created_by', a.created_by,
      'last_update', a.last_update
    ),

    'education', COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', ae.id,
        'course', ae.course,
        'school', ae.school,
        'year', ae.year,
        'last_update', ae.last_updated
      )) FILTER (WHERE ae.id IS NOT NULL),
      '[]'::jsonb
    ),

    'awards', COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', aw.id,
        'award', aw.award,
        'description', aw.description,
        'year', aw.year,
        'last_update', aw.last_updated
      )) FILTER (WHERE aw.id IS NOT NULL),
      '[]'::jsonb
    ),

    'instruments', COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', ai.id,
        'id_instrument', ai.id_instrument,
        'instrument_name', si.name,
        'color', si.color,
        'created_on', ai.created_on
      )) FILTER (WHERE ai.id IS NOT NULL),
      '[]'::jsonb
    ),

    'media', COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', am.id,
        'id_media', am.id_media,
        'title', am.title,
        'image', am.image,
        'description', am.description,
        'url', am.url,
        'created_on', am.created_on
      )) FILTER (WHERE am.id IS NOT NULL),
      '[]'::jsonb
    ),

    'performance_type', COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', sap.id,
        'name', sap.name,
        'last_update', sap.last_update
      )) FILTER (WHERE sap.id IS NOT NULL),
      '[]'::jsonb
    ),

    'availability', COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', av.id,
        'start_date', av.start_date,
        'end_date', av.end_date,
        'notes', av.notes,
        'created_on', av.created_on,
        'last_updated', av.last_updated
      )) FILTER (WHERE av.id IS NOT NULL),
      '[]'::jsonb
    ),

    'requirements', COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', arq.id,
        'rib', arq.rib,
        'guso_nb', arq.guso_nb,
        'security_nb', arq.security_nb,
        'arlergies', arq.arlergies,
        'food_restriction', arq.food_restriction,
        'requirement', arq.requirement,
        'created_on', arq.created_on,
        'last_updated', arq.last_updated
      )) FILTER (WHERE arq.id IS NOT NULL),
      '[]'::jsonb
    ),

    'requests', COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', ar.id,
        'title', ar.title,
        'short_desc', ar.short_desc,
        'long_desc', ar.long_desc,
        'status', ar.status,
        'comment', ar.comment,
        'created_on', ar.created_on,
        'last_update', ar.last_update,
        'media', (
          SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'id', arm.id,
            'id_media_type', arm.id_media_type,
            'title', arm.title,
            'image', arm.image,
            'description', arm.description,
            'url', arm.url
          )), '[]'::jsonb)
          FROM public.artist_request_media arm
          WHERE arm.id_request = ar.id
        )
      )) FILTER (WHERE ar.id IS NOT NULL),
      '[]'::jsonb
    )
  )
  INTO result
  FROM public.artists a
  LEFT JOIN public.artist_education ae ON ae.id_artist = a.id
  LEFT JOIN public.artist_awards aw ON aw.id_artist = a.id
  LEFT JOIN public.artist_instruments ai ON ai.id_artist = a.id
  LEFT JOIN public.sys_instruments si ON si.id = ai.id_instrument
  LEFT JOIN public.artist_media am ON am.id_artist = a.id
  LEFT JOIN public.artist_performance ap ON ap.id_artist = a.id
  LEFT JOIN public.sys_artist_performance sap ON sap.id = ap.id_performance
  LEFT JOIN public.artist_availability av ON av.id_artist = a.id
  LEFT JOIN public.artist_requirement arq ON arq.id_artist = a.id
  LEFT JOIN public.artist_request ar ON ar.id_artist = a.id
  WHERE a.id_profile = artist_id
  GROUP BY a.id;

  RETURN result;
END;
$$;


--
-- Name: get_artists_for_home(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_artists_for_home() RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id_artist', a.id,
        'fname', a.fname,
        'lname', a.lname,
        'tagline', a.teaser,
        'short_bio', a.short_bio,
        'photo', a.photo,

        -- 🎵 Instruments
        'instruments', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'id_instrument', ai.id_instrument,
              'id_artist', ai.id_artist,
              'instrument', si.name
            )
          )
          FROM artist_instruments ai
          INNER JOIN sys_instruments si ON si.id = ai.id_instrument
          WHERE ai.id_artist = a.id
        ), '[]'::jsonb),

        -- 🎭 Performance Types
        'performance', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'id_performance', ap.id_performance,
              'id_artist', ap.id_artist,
              'performance', sp.name
            )
          )
          FROM artist_performance ap
          INNER JOIN sys_artist_performance sp ON sp.id = ap.id_performance
          WHERE ap.id_artist = a.id
        ), '[]'::jsonb)
      )
    )
    FROM artists a
    WHERE a.is_active = true
      AND a.is_featured = true
  );
END;
$$;


--
-- Name: get_artists_with_details(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_artists_with_details() RETURNS json
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'id_artist', a.id,
        'fname', a.fname,
        'lname', a.lname,
        'title', a.title,
        'teaser', a.teaser,
        'photo', a.photo,
        'credit_photo', a.credit_photo,
        'instruments', (
          SELECT json_agg(
            json_build_object(
              'id', si.id,
              'name', si.name
            )
          )
          FROM artist_instruments ai
          JOIN sys_instruments si ON si.id = ai.id_instrument
          WHERE ai.id_artist = a.id
        ),
        'performance_type', (
          SELECT json_agg(
            json_build_object(
              'id', sp.id,
              'name', sp.name
            )
          )
          FROM artist_performance ap
          JOIN sys_artist_performance sp ON sp.id = ap.id_performance
          WHERE ap.id_artist = a.id
        )
      )
    )
    FROM artists a
    WHERE a.is_active = true
  );
END;
$$;


--
-- Name: get_event_list_home(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_event_list_home() RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(event_data)
    FROM (
      SELECT jsonb_build_object(
        'id', ev.id,
        'title', ev.title,
        'teaser', ev.teaser,
        'long_teaser', ev.long_teaser,
        'description', ev.description,
        'photo', ev.photo,
        'credit_photo', ev.credit_photo,
        'booking_url', ev.booking_url,
        'id_event_type', ev.id_event_type,
        'event_type', setype.name,
        'id_event_domain', ev.id_event_domain,
        'id_host', ev.id_host,
        'host', h.name,
        'is_active', ev.is_active,

        -- ✅ Get main location from the earliest event_date
        'location', COALESCE((
          SELECT jsonb_build_object(
            'id_location', loc.id,
            'name', loc.name,
            'address', loc.address,
            'city', loc.city,
            'country', loc.country
          )
          FROM event_dates evd
          LEFT JOIN locations loc ON evd.id_location = loc.id
          WHERE evd.id_event = ev.id
          ORDER BY evd.date ASC
          LIMIT 1
        ), '{}'::jsonb),

        -- nested event_dates
        'event_dates', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', evd.id,
              'date', evd.date,
              'time', evd.time,
              'id_location', loc.id,
              'location_name', loc.name
            ) ORDER BY evd.date, evd.time
          )
          FROM event_dates evd
          LEFT JOIN locations loc ON evd.id_location = loc.id
          WHERE evd.id_event = ev.id
        ), '[]'::jsonb),

        -- nested event_shows
        'event_shows', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', evs.id,
              'title', evs.title,
              'description', evs.description,
              'time_manage', evs.time_manage
            )
          )
          FROM event_shows evs
          WHERE evs.id_event = ev.id
        ), '[]'::jsonb),

        -- nested event_artists
        'event_artists', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'id_event', eva.id_event,
              'id_artist', ar.id,
              'fname', ar.fname,
              'lname', ar.lname,
              'photo', ar.photo
            )
          )
          FROM event_artists eva
          LEFT JOIN artists ar ON eva.id_artist = ar.id
          WHERE eva.id_event = ev.id
        ), '[]'::jsonb),

        -- nested instruments
        'instruments', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'id_instrument', evi.id_instrument,
              'id_event', evi.id_event,
              'instrument', sin.name
            )
          )
          FROM event_instruments evi
          LEFT JOIN sys_instruments sin ON sin.id = evi.id_instrument
          WHERE evi.id_event = ev.id
        ), '[]'::jsonb)

      ) AS event_data,

      -- 👇 Determine the next upcoming date for ordering
      (
        SELECT MIN(evd.date)
        FROM event_dates evd
        WHERE evd.id_event = ev.id
      ) AS next_event_date

      FROM events ev
      LEFT JOIN hosts h ON ev.id_host = h.id
      LEFT JOIN sys_event_types setype ON ev.id_event_type = setype.id
      WHERE ev.is_active = true
        AND (
          SELECT MIN(evd.date)
          FROM event_dates evd
          WHERE evd.id_event = ev.id
        ) >= CURRENT_DATE
      ORDER BY next_event_date ASC
      LIMIT 4
    ) t
  );
END;
$$;


--
-- Name: get_events_with_dates(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_events_with_dates(p_id_artist integer) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(event_json ORDER BY event_json->>'latest_start_date' ASC)
    FROM (
      SELECT jsonb_build_object(
        'id_event', e.id,
        'title', e.title,
        'edition', concat(ed.name, ' ', ed.year),
        'event_dates', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'start_date', d.start_date,
              'end_date', d.end_date,
              'time', d.time,
              'location', l.name
            ) ORDER BY d.start_date ASC
          )
          FROM public.event_dates d
          INNER JOIN public.locations l ON d.id_location = l.id
          WHERE d.id_event = e.id AND d.start_date > current_date
        ),
        'latest_start_date', (
          SELECT MAX(d.start_date)
          FROM public.event_dates d
          WHERE d.id_event = e.id AND d.start_date > current_date
        )
      ) AS event_json
      FROM public.events e
      INNER JOIN public.event_edition ed ON e.id_edition = ed.id
      WHERE e.id IN (
        SELECT g.id_event
        FROM public.event_artists g
        WHERE g.id_artist = p_id_artist
      )
    ) t
  );
END;
$$;


--
-- Name: get_events_with_details(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_events_with_details() RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', e.id,
                'title', e.title,
                'id_edition', e.id_edition,
                'edition', e.edition,
                'edition_type', e.edition_type,
                'id_event_domain', e.id_event_domain,
                'event_domain', e.event_domain,
                'id_event_type', e.id_event_type,
                'event_type', e.event_type,
                'teaser', e.teaser,
                'photo', e.photo,
                'is_active', e.is_active,
                'is_completed', e.all_dates_passed,
                'event_artists', e.event_artists,
                'event_instruments', e.event_instruments,
                'event_dates', e.event_dates,
				'status', e.status
            )
            ORDER BY e.earliest_event_date ASC, e.title ASC  -- ✅ Sort by date, then by title A–Z
        )
        FROM (
            SELECT 
                ev.id,
                ev.title,
                ev.id_edition,
                CONCAT(ed.name, ' ', ed.year) AS edition,
                et.name AS edition_type,
                ev.id_event_domain,
                edom.name AS event_domain,
                ev.id_event_type,
                etyp.name AS event_type,
                ev.teaser,
                ev.photo,
                ev.is_active,
				ev.status,

                -- 📅 Get earliest and latest event date
                MIN(DATE(edates_all.start_date)) AS earliest_event_date,
                MAX(DATE(edates_all.end_date)) AS latest_event_date,

                -- 🚩 Check if all dates have passed
                (MAX(DATE(edates_all.end_date)) < CURRENT_DATE) AS all_dates_passed,

                -- 👩‍🎤 Artists
                COALESCE(artists_list.artists, '[]'::jsonb) AS event_artists,

                -- 🎸 Instruments
                COALESCE(instruments_list.instruments, '[]'::jsonb) AS event_instruments,

                -- 📆 Event Dates (sorted earliest first)
                COALESCE(dates_list.dates, '[]'::jsonb) AS event_dates

            FROM events ev
            LEFT JOIN event_edition ed ON ev.id_edition = ed.id
            LEFT JOIN sys_event_edition et ON ed.id_edition_type = et.id
            LEFT JOIN sys_event_domain edom ON ev.id_event_domain = edom.id
            LEFT JOIN sys_event_type etyp ON ev.id_event_type = etyp.id
            LEFT JOIN event_dates edates_all ON edates_all.id_event = ev.id

            -- 👩‍🎤 Artists
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object('artist', CONCAT(a.fname, ' ', a.lname))
                ) AS artists
                FROM event_artists ea
                LEFT JOIN artists a ON ea.id_artist = a.id
                WHERE ea.id_event = ev.id
            ) AS artists_list ON TRUE

            -- 🎸 Instruments
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object('name', i.name)
                ) AS instruments
                FROM event_instruments ei
                INNER JOIN sys_instruments i ON ei.id_instrument = i.id
                WHERE ei.id_event = ev.id
            ) AS instruments_list ON TRUE

            -- 📅 Event Dates (properly ordered earliest first)
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'date', date_series.date,
                        'time', TO_CHAR(edates.time, 'HH24:MI'),
                        'location', l.name
                    )
                    ORDER BY date_series.date ASC  -- ✅ inner array sorted earliest first
                ) AS dates
                FROM event_dates edates
                LEFT JOIN locations l ON edates.id_location = l.id
                CROSS JOIN generate_series(
                    DATE(edates.start_date),
                    DATE(edates.end_date),
                    '1 day'::interval
                ) AS date_series(date)
                WHERE edates.id_event = ev.id
            ) AS dates_list ON TRUE

            WHERE dates_list.dates IS NOT NULL
            GROUP BY ev.id, ed.name, ed.year, et.name, edom.name, etyp.name,
                     artists_list.artists, instruments_list.instruments, dates_list.dates
        ) AS e
    );
END;
$$;


--
-- Name: get_events_with_details_v1(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_events_with_details_v1() RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', e.id,
                'title', e.title,
                'id_edition', e.id_edition,
                'edition', e.edition,
                'edition_type', e.edition_type,
                'id_event_domain', e.id_event_domain,
                'event_domain', e.event_domain,
                'id_event_type', e.id_event_type,
                'event_type', e.event_type,
                'teaser', e.teaser,
                'photo', e.photo,
                'is_active', e.is_active,
                'is_completed', e.all_dates_passed,
                'event_artists', e.event_artists,
                'event_instruments', e.event_instruments,
                'event_dates', e.event_dates,
                'period', e.period
            )
            ORDER BY e.earliest_event_date ASC, e.title ASC
        )
        FROM (
            SELECT 
                ev.id,
                ev.title,
                ev.id_edition,
                CONCAT(ed.name, ' ', ed.year) AS edition,
                et.name AS edition_type,
                ev.id_event_domain,
                edom.name AS event_domain,
                ev.id_event_type,
                etyp.name AS event_type,
                ev.teaser,
                ev.photo,
                ev.is_active,

                MIN(DATE(edates_all.start_date)) AS earliest_event_date,
                MAX(DATE(edates_all.end_date)) AS latest_event_date,
                (MAX(DATE(edates_all.end_date)) < CURRENT_DATE) AS all_dates_passed,

                -- 🎤 Artists
                COALESCE(artists_list.artists, '[]'::jsonb) AS event_artists,

                -- 🎸 Instruments
                COALESCE(instruments_list.instruments, '[]'::jsonb) AS event_instruments,

                -- 📅 Daily dates (flag = 'd')
                COALESCE(daily_dates_list.daily_dates, '[]'::jsonb) AS event_dates,

                -- 🟦 Period blocks (flag = 'p')
                COALESCE(period_list.period, '[]'::jsonb) AS period

            FROM events ev
            LEFT JOIN event_edition ed ON ev.id_edition = ed.id
            LEFT JOIN sys_event_edition et ON ed.id_edition_type = et.id
            LEFT JOIN sys_event_domain edom ON ev.id_event_domain = edom.id
            LEFT JOIN sys_event_type etyp ON ev.id_event_type = etyp.id
            LEFT JOIN event_dates edates_all ON edates_all.id_event = ev.id

            -- 🎤 Artists
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'artist', CONCAT(a.fname, ' ', a.lname)
                    )
                ) AS artists
                FROM event_artists ea
                LEFT JOIN artists a ON ea.id_artist = a.id
                WHERE ea.id_event = ev.id
            ) AS artists_list ON TRUE

            -- 🎸 Instruments
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object('name', i.name)
                ) AS instruments
                FROM event_instruments ei
                INNER JOIN sys_instruments i ON ei.id_instrument = i.id
                WHERE ei.id_event = ev.id
            ) AS instruments_list ON TRUE

            -- 📅 DAILY DATES (flag = 'd')
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'date', date_series.date,
                        'time', TO_CHAR(edates.time, 'HH24:MI'),
                        'location', l.name,
                        'is_period', FALSE
                    )
                    ORDER BY date_series.date ASC
                ) AS daily_dates
                FROM event_dates edates
                LEFT JOIN locations l ON edates.id_location = l.id
                CROSS JOIN generate_series(
                    DATE(edates.start_date),
                    DATE(edates.end_date),
                    '1 day'::interval
                ) AS date_series(date)
                WHERE edates.id_event = ev.id
                  AND edates.flag = 'd'
            ) AS daily_dates_list ON TRUE

            -- 🟦 PERIOD OBJECTS (flag = 'p')
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'start_date', edates.start_date,
                        'end_date', edates.end_date,
                        'time', TO_CHAR(edates.time, 'HH24:MI'),
                        'location', l.name,
                        'is_period', TRUE
                    )
                    ORDER BY edates.start_date ASC
                ) AS period
                FROM event_dates edates
                LEFT JOIN locations l ON edates.id_location = l.id
                WHERE edates.id_event = ev.id
                  AND edates.flag = 'p'
            ) AS period_list ON TRUE

            -- ✅ ADDED: Only include events with status = 0 (e.g., published)
            WHERE ev.status in (0, 1)

            GROUP BY ev.id, ed.name, ed.year, et.name, edom.name, etyp.name,
                     artists_list.artists, instruments_list.instruments,
                     daily_dates_list.daily_dates, period_list.period
        ) AS e
    );
END;
$$;


--
-- Name: get_events_with_details_v3(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_events_with_details_v3() RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', e.id,
                'title', e.title,
                'id_edition', e.id_edition,
                'edition', e.edition,
                'edition_type', e.edition_type,
                'id_event_domain', e.id_event_domain,
                'event_domain', e.event_domain,
                'id_event_type', e.id_event_type,
                'event_type', e.event_type,
                'teaser', e.teaser,
                'photo', e.photo,
                'is_active', e.is_active,
                'is_completed', e.all_dates_passed,
                'event_artists', e.event_artists,
                'event_instruments', e.event_instruments,
                'event_dates', e.event_dates,
                'period', e.period,
                'location', e.first_location,
                'event_act_date', e.first_event_date
            )
            ORDER BY e.earliest_event_date ASC, e.title ASC
        )
        FROM (
            SELECT 
                ev.id,
                ev.title,
                ev.id_edition,
                CONCAT(ed.name, ' ', ed.year) AS edition,
                et.name AS edition_type,
                ev.id_event_domain,
                edom.name AS event_domain,
                ev.id_event_type,
                etyp.name AS event_type,
                ev.teaser,
                ev.photo,
                ev.is_active,

                MIN(DATE(edates_all.start_date)) AS earliest_event_date,
                MAX(DATE(edates_all.end_date)) AS latest_event_date,
                (MAX(DATE(edates_all.end_date)) < CURRENT_DATE) AS all_dates_passed,

                -- 🎤 Artists
                COALESCE(artists_list.artists, '[]'::jsonb) AS event_artists,

                -- 🎸 Instruments
                COALESCE(instruments_list.instruments, '[]'::jsonb) AS event_instruments,

                -- 📅 Daily dates (flag = 'd')
                COALESCE(daily_dates_list.daily_dates, '[]'::jsonb) AS event_dates,

                -- 🟦 Period blocks (flag = 'p')
                COALESCE(period_list.period, '[]'::jsonb) AS period,

                -- 🏷 First location from event_dates or period
                COALESCE(
                    (SELECT (x->>'location') FROM jsonb_array_elements(daily_dates_list.daily_dates) x LIMIT 1),
                    (SELECT (x->>'location') FROM jsonb_array_elements(period_list.period) x LIMIT 1)
                ) AS first_location,

                -- 📆 First actual event date
                COALESCE(
                    (SELECT (x->>'date') FROM jsonb_array_elements(daily_dates_list.daily_dates) x WHERE x->>'is_period' = 'false' LIMIT 1),
                    (SELECT (x->>'start_date') FROM jsonb_array_elements(period_list.period) x WHERE x->>'is_period' = 'true' LIMIT 1)
                ) AS first_event_date

            FROM events ev
            LEFT JOIN event_edition ed ON ev.id_edition = ed.id
            LEFT JOIN sys_event_edition et ON ed.id_edition_type = et.id
            LEFT JOIN sys_event_domain edom ON ev.id_event_domain = edom.id
            LEFT JOIN sys_event_type etyp ON ev.id_event_type = etyp.id
            LEFT JOIN event_dates edates_all ON edates_all.id_event = ev.id

            -- 🎤 Artists
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'artist', CONCAT(a.fname, ' ', a.lname)
                    )
                ) AS artists
                FROM event_artists ea
                LEFT JOIN artists a ON ea.id_artist = a.id
                WHERE ea.id_event = ev.id
            ) AS artists_list ON TRUE

            -- 🎸 Instruments
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object('name', i.name)
                ) AS instruments
                FROM event_instruments ei
                INNER JOIN sys_instruments i ON ei.id_instrument = i.id
                WHERE ei.id_event = ev.id
            ) AS instruments_list ON TRUE

            -- 📅 DAILY DATES (flag = 'd')
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'date', date_series.date,
                        'time', TO_CHAR(edates.time, 'HH24:MI'),
                        'location', l.name,
                        'is_period', FALSE
                    )
                    ORDER BY date_series.date ASC
                ) AS daily_dates
                FROM event_dates edates
                LEFT JOIN locations l ON edates.id_location = l.id
                CROSS JOIN generate_series(
                    DATE(edates.start_date),
                    DATE(edates.end_date),
                    '1 day'::interval
                ) AS date_series(date)
                WHERE edates.id_event = ev.id
                  AND edates.flag = 'd'
            ) AS daily_dates_list ON TRUE

            -- 🟦 PERIOD OBJECTS (flag = 'p')
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'start_date', edates.start_date,
                        'end_date', edates.end_date,
                        'time', TO_CHAR(edates.time, 'HH24:MI'),
                        'location', l.name,
                        'is_period', TRUE
                    )
                    ORDER BY edates.start_date ASC
                ) AS period
                FROM event_dates edates
                LEFT JOIN locations l ON edates.id_location = l.id
                WHERE edates.id_event = ev.id
                  AND edates.flag = 'p'
            ) AS period_list ON TRUE

            -- ✅ Only include events with status = 0 (published)
            WHERE ev.status in (0, 1)

            GROUP BY ev.id, ed.name, ed.year, et.name, edom.name, etyp.name,
                     artists_list.artists, instruments_list.instruments,
                     daily_dates_list.daily_dates, period_list.period
        ) AS e
    );
END;
$$;


--
-- Name: get_events_with_details_visitor_list(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_events_with_details_visitor_list() RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', e.id,
                'title', e.title,
                'id_edition', e.id_edition,
                'edition', e.edition,
                'edition_type', e.edition_type,
                'id_event_domain', e.id_event_domain,
                'event_domain', e.event_domain,
                'id_event_type', e.id_event_type,
                'event_type', e.event_type,
                'teaser', e.teaser,
                'photo', e.photo,
                'is_active', e.is_active,
                'is_completed', e.all_dates_passed,
                'event_artists', e.event_artists,
                'event_instruments', e.event_instruments,
                'event_dates', e.event_dates,
                'period', e.period
            )
            ORDER BY e.earliest_event_date ASC, e.title ASC
        )
        FROM (
            SELECT 
                ev.id,
                ev.title,
                ev.id_edition,
                CONCAT(ed.name, ' ', ed.year) AS edition,
                et.name AS edition_type,
                ev.id_event_domain,
                edom.name AS event_domain,
                ev.id_event_type,
                etyp.name AS event_type,
                ev.teaser,
                ev.photo,
                ev.is_active,

                MIN(DATE(edates_all.start_date)) AS earliest_event_date,
                MAX(DATE(edates_all.end_date)) AS latest_event_date,
                (MAX(DATE(edates_all.end_date)) < CURRENT_DATE) AS all_dates_passed,

                -- 🎤 Artists
                COALESCE(artists_list.artists, '[]'::jsonb) AS event_artists,

                -- 🎸 Instruments
                COALESCE(instruments_list.instruments, '[]'::jsonb) AS event_instruments,

                -- 📅 Daily dates (flag = 'd')
                COALESCE(daily_dates_list.daily_dates, '[]'::jsonb) AS event_dates,

                -- 🟦 Period blocks (flag = 'p')
                COALESCE(period_list.period, '[]'::jsonb) AS period

            FROM events ev
            LEFT JOIN event_edition ed ON ev.id_edition = ed.id
            LEFT JOIN sys_event_edition et ON ed.id_edition_type = et.id
            LEFT JOIN sys_event_domain edom ON ev.id_event_domain = edom.id
            LEFT JOIN sys_event_type etyp ON ev.id_event_type = etyp.id
            LEFT JOIN event_dates edates_all ON edates_all.id_event = ev.id

            -- 🎤 Artists
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'artist', CONCAT(a.fname, ' ', a.lname)
                    )
                ) AS artists
                FROM event_artists ea
                LEFT JOIN artists a ON ea.id_artist = a.id
                WHERE ea.id_event = ev.id
            ) AS artists_list ON TRUE

            -- 🎸 Instruments
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object('name', i.name)
                ) AS instruments
                FROM event_instruments ei
                INNER JOIN sys_instruments i ON ei.id_instrument = i.id
                WHERE ei.id_event = ev.id
            ) AS instruments_list ON TRUE

            -- 📅 DAILY DATES (flag = 'd')
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'date', date_series.date,
                        'time', TO_CHAR(edates.time, 'HH24:MI'),
                        'location', l.name,
                        'is_period', FALSE
                    )
                    ORDER BY date_series.date ASC
                ) AS daily_dates
                FROM event_dates edates
                LEFT JOIN locations l ON edates.id_location = l.id
                CROSS JOIN generate_series(
                    DATE(edates.start_date),
                    DATE(edates.end_date),
                    '1 day'::interval
                ) AS date_series(date)
                WHERE edates.id_event = ev.id
                  AND edates.flag = 'd'
            ) AS daily_dates_list ON TRUE

            -- 🟦 PERIOD OBJECTS (flag = 'p')
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'start_date', edates.start_date,
                        'end_date', edates.end_date,
                        'time', TO_CHAR(edates.time, 'HH24:MI'),
                        'location', l.name,
                        'is_period', TRUE
                    )
                    ORDER BY edates.start_date ASC
                ) AS period
                FROM event_dates edates
                LEFT JOIN locations l ON edates.id_location = l.id
                WHERE edates.id_event = ev.id
                  AND edates.flag = 'p'
            ) AS period_list ON TRUE

            -- ✅ ADDED: Only include events with status = 0 (e.g., published)
            WHERE ev.status in (0)

            GROUP BY ev.id, ed.name, ed.year, et.name, edom.name, etyp.name,
                     artists_list.artists, instruments_list.instruments,
                     daily_dates_list.daily_dates, period_list.period
        ) AS e
    );
END;
$$;


--
-- Name: get_hosts_by_profile(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_hosts_by_profile(p_id_profile uuid) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN (
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', h.id,
                'name', h.name,
                'address', h.address,
                'city', h.city,
                'proviance', h.proviance,
                'zip', h.zip,
                'country', h.country,
                'host_per_year', h.host_per_year,
                'public_name', h.public_name,
                'capacity', h.capacity,
                'id_host_type', h.id_host_type,
                'host_type', sh.name,
                'contact_fname', h.contact_fname,
                'contact_lname', h.contact_lname,
                'contact_phone1', h.contact_phone1,
                'contact_phone2', h.contact_phone2,
                'contact_email', h.contact_email,
                'comment', h.comment,
                'web_url', h.web_url,
                'photo', h.photo,
                'photo_credit', h.photo_credit
            )
        ), '[]'::jsonb)
        FROM hosts h
        INNER JOIN sys_host_types sh 
            ON h.id_host_type = sh.id
        WHERE h.id IN (
            SELECT hu.id_host
            FROM host_users hu
            WHERE hu.id_profile = p_id_profile
        )
    );
END;
$$;


--
-- Name: get_location_profile(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_location_profile(location_id integer) RETURNS TABLE(id integer, id_host text, name text, address text, lat text, long text, description text, public_description text, public text, restricted_description text, capacity text, city text, country text, zip text, phone text, email text, website text, is_active boolean, host text, host_name text, host_phone text, host_email text, types jsonb, amenities jsonb, specs jsonb, images jsonb)
    LANGUAGE sql STABLE
    AS $$
  SELECT
    l.id,
    l.id_host,
    l.name,
    l.address,
    l.lat,
    l.long,
	l.description,
    l.public_description,
	l.public,
	l.restricted_description,
    l.capacity,
    l.city,
    
    l.country,
    l.zip,
    l.phone,
    l.email,
    l.website,
    l.is_active,
    h.name as host,
    concat(h.contact_fname, ' ', h.contact_lname) as host_name,
    h.contact_phone1 as host_phone,
    h.contact_email as host_email,

    -- types
    COALESCE(
      (SELECT JSONB_AGG(DISTINCT JSONB_BUILD_OBJECT(
        'id', t2.id,
        'id_type', t2.id_location_type,
        'name', slt2.name
      ))
       FROM location_types t2
       JOIN sys_location_types slt2 ON slt2.id = t2.id_location_type
       WHERE t2.id_location = l.id
      ),
      '[]'::jsonb
    ) AS types,

    -- amenities
    COALESCE(
      (SELECT JSONB_AGG(DISTINCT JSONB_BUILD_OBJECT(
        'id', a2.id,
        'id_amenity', a2.id_amenity,
        'name', sla2.name
      ))
       FROM location_amenity a2
       JOIN sys_location_amenity sla2 ON sla2.id = a2.id_amenity
       WHERE a2.id_location = l.id
      ),
      '[]'::jsonb
    ) AS amenities,

    -- specs
    COALESCE(
      (SELECT JSONB_AGG(DISTINCT JSONB_BUILD_OBJECT(
        'id', s2.id,
        'id_specs', s2.id_specs,
        'name', sls2.name
      ))
       FROM location_specs s2
       JOIN sys_location_specs sls2 ON sls2.id = s2.id_specs
       WHERE s2.id_location = l.id
      ),
      '[]'::jsonb
    ) AS specs,

    -- images
    COALESCE(
      (SELECT JSONB_AGG(DISTINCT JSONB_BUILD_OBJECT(
        'id', i2.id,
        'url', i2.url,
        'created_by', i2.created_by,
        'created_on', i2.created_on
      ))
       FROM location_images i2
       WHERE i2.id_location = l.id
      ),
      '[]'::jsonb
    ) AS images

  FROM locations l
  LEFT JOIN hosts h ON l.id_host::text = h.id::text
  WHERE l.id = location_id
$$;


--
-- Name: get_location_visitor_list(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_location_visitor_list() RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(location_data ORDER BY location_data->>'location' ASC)
    FROM (
      SELECT jsonb_build_object(
        'id_location', l.id,
        'location', l.name, 
        'address', l.address,
        'capacity', l.capacity,
        'city', l.city, 
        'country', l.country,
        'description', l.description,
        'created_on', l.created_on,
        'host', h.name,

        -- 🏡 Amenities
        'amenity', COALESCE((
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', lam.id,
                'id_location', lam.id_location,
                'id_amenity', lam.id_amenity,
                'amenity', sla.name
              )
              ORDER BY sla.name ASC
            )
            FROM location_amenity lam
            INNER JOIN sys_location_amenity sla 
              ON sla.id = lam.id_amenity 
            WHERE lam.id_location = l.id
        ), '[]'::jsonb),

        -- 🏷️ Types
        'types', COALESCE((
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', lat.id,
                'id_location', lat.id_location,
                'id_type', lat.id_location_type,
                'type', slt.name
              )
              ORDER BY slt.name ASC
            )
            FROM location_types lat
            INNER JOIN sys_location_types slt
              ON slt.id = lat.id_location_type 
            WHERE lat.id_location = l.id
        ), '[]'::jsonb),

        -- ⚙️ Specs
        'specs', COALESCE((
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', los.id,
                'id_location', los.id_location,
                'id_specs', los.id_specs,
                'specs', sls.name
              )
              ORDER BY sls.name ASC
            )
            FROM location_specs los
            INNER JOIN sys_location_specs sls
              ON sls.id = los.id_specs 
            WHERE los.id_location = l.id
        ), '[]'::jsonb),

        -- 🖼️ Images
        'images', COALESCE((
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', loi.id,
                'id_location', loi.id_location,
                'url', loi.url
              )
              ORDER BY loi.id ASC
            )
            FROM location_images loi
            WHERE loi.id_location = l.id
        ), '[]'::jsonb)
      ) AS location_data
      FROM locations l
      INNER JOIN hosts h 
        ON l.id_host::text = h.id::text
		where l.is_active = true
      ORDER BY l.name ASC  -- ✅ Sort before aggregation
    ) AS sorted_locations
  );
END;
$$;


--
-- Name: get_single_events_with_details(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_single_events_with_details(p_event_id integer DEFAULT NULL::integer) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', event_data.id,
                'title', event_data.title,
                'id_edition', event_data.id_edition,
                'edition', event_data.edition,
                'edition_type', event_data.edition_type,
                'id_event_domain', event_data.id_event_domain,
                'event_domain', event_data.event_domain,
                'id_event_type', event_data.id_event_type,
                'event_type', event_data.event_type,
                'teaser', event_data.teaser,
                'long_teaser', event_data.long_teaser,
                'description', event_data.description,
                'booking_url', event_data.booking_url,
                'credit_photo', event_data.credit_photo,
                'photo', event_data.photo,
                'is_active', event_data.is_active,
                'is_completed', event_data.all_dates_passed,
                'event_artists', event_data.event_artists,
                'event_instruments', event_data.event_instruments,
                'event_dates', event_data.event_dates,
                'event_media', event_data.event_media
            )
        )
        FROM (
            SELECT 
                ev.id,
                ev.title,
                ev.id_edition,
                CONCAT(ed.name, ' ', ed.year) as edition,
                et.name as edition_type,
                ev.id_event_domain,
                edom.name as event_domain,
                ev.id_event_type,
                etyp.name as event_type,
                ev.teaser,
                ev.long_teaser,
                ev.description,
                ev.booking_url,
                ev.credit_photo,
                ev.photo,
                ev.is_active,
                -- Check if all event date ranges have passed
                (MAX(DATE(edates_all.end_date)) < CURRENT_DATE) as all_dates_passed,
                MIN(DATE(edates_all.start_date)) as earliest_date, -- For sorting
                COALESCE(artists_list.artists, '[]'::jsonb) as event_artists,
                COALESCE(instruments_list.instruments, '[]'::jsonb) as event_instruments,
                COALESCE(dates_list.dates, '[]'::jsonb) as event_dates,
                COALESCE(media_list.event_media, '[]'::jsonb) as event_media,
                -- Add the completion status for sorting
                (ev.is_active AND MAX(DATE(edates_all.end_date)) < CURRENT_DATE) as is_event_completed
            FROM events ev
            LEFT JOIN event_edition ed ON ev.id_edition = ed.id
            LEFT JOIN sys_event_edition et ON ed.id_edition_type = et.id
            LEFT JOIN sys_event_domain edom ON ev.id_event_domain = edom.id
            LEFT JOIN sys_event_type etyp ON ev.id_event_type = etyp.id
            LEFT JOIN event_dates edates_all ON edates_all.id_event = ev.id
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
						'id_artist', a.id,
                        'artist', CONCAT(a.fname, ' ', a.lname),
                        'teaser', a.teaser,
						'short_bio', a.short_bio,
                        'photo', a.photo,
                        'credit_photo', a.credit_photo,
                        'artist_media', COALESCE(artist_media_list.artist_media, '[]'::jsonb)
                    )
                ) AS artists
                FROM event_artists ea
                LEFT JOIN artists a ON ea.id_artist = a.id
                LEFT JOIN LATERAL (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'title', am.title,
                            'image', am.image,
                            'description', am.description,
                            'url', am.url
                        )
                    ) AS artist_media
                    FROM artist_media am
                    WHERE am.id_artist = a.id
                ) AS artist_media_list ON true
                WHERE ea.id_event = ev.id
            ) AS artists_list ON true
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object('name', i.name)
                ) AS instruments
                FROM event_instruments ei
                INNER JOIN sys_instruments i ON ei.id_instrument = i.id
                WHERE ei.id_event = ev.id
            ) AS instruments_list ON true
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'date', date_series.date,
                        'time', TO_CHAR(edates.time, 'HH24:MI'),
                        'location', l.name,
						'id_location', edates.id_location
                    )
                ) AS dates
                FROM event_dates edates
                LEFT JOIN locations l ON edates.id_location = l.id
                CROSS JOIN generate_series(
                    DATE(edates.start_date),
                    DATE(edates.end_date),
                    '1 day'::interval
                ) AS date_series(date)
                WHERE edates.id_event = ev.id
                  AND (p_event_id IS NULL OR ev.id = p_event_id)
                  AND date_series.date >= DATE_TRUNC('month', CURRENT_DATE)
            ) AS dates_list ON true
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'title', em.title,
                        'image', em.image,
                        'description', em.description,
                        'url', em.url
                    )
                ) AS event_media
                FROM event_media em
                WHERE em.id_event = ev.id
            ) AS media_list ON true
            WHERE dates_list.dates IS NOT NULL -- Only include events that have at least one valid date
              AND (p_event_id IS NULL OR ev.id = p_event_id)
            GROUP BY ev.id, ed.name, ed.year, et.name, edom.name, etyp.name, 
                     artists_list.artists, instruments_list.instruments, dates_list.dates, media_list.event_media
            ORDER BY (ev.is_active AND MAX(DATE(edates_all.end_date)) < CURRENT_DATE) ASC,
                     MIN(DATE(edates_all.start_date)) ASC
        ) AS event_data
    );
END;
$$;


--
-- Name: get_single_events_with_details_host(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_single_events_with_details_host(p_event_id integer DEFAULT NULL::integer) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', event_data.id,
                'title', event_data.title,
                'id_edition', event_data.id_edition,
                'edition', event_data.edition,
                'edition_type', event_data.edition_type,
                'id_event_domain', event_data.id_event_domain,
                'event_domain', event_data.event_domain,
                'id_event_type', event_data.id_event_type,
                'event_type', event_data.event_type,
                'teaser', event_data.teaser,
                'long_teaser', event_data.long_teaser,
                'description', event_data.description,
                'booking_url', event_data.booking_url,
                'credit_photo', event_data.credit_photo,
                'photo', event_data.photo,
                'is_active', event_data.is_active,
                'is_completed', event_data.all_dates_passed,
                'event_artists', event_data.event_artists,
                'event_instruments', event_data.event_instruments,
                'event_dates', event_data.event_dates,
                'event_media', event_data.event_media
            )
        )
        FROM (
            SELECT 
                ev.id,
                ev.title,
                ev.id_edition,
                CONCAT(ed.name, ' ', ed.year) AS edition,
                et.name AS edition_type,
                ev.id_event_domain,
                edom.name AS event_domain,
                ev.id_event_type,
                etyp.name AS event_type,
                ev.teaser,
                ev.long_teaser,
                ev.description,
                ev.booking_url,
                ev.credit_photo,
                ev.photo,
                ev.is_active,

                -- compute completion based only on event_dates
                (MAX(DATE(ed_all.end_date)) < CURRENT_DATE) AS all_dates_passed,

                MIN(DATE(ed_all.start_date)) AS earliest_date,

                COALESCE(artists_list.artists, '[]'::jsonb) AS event_artists,
                COALESCE(instruments_list.instruments, '[]'::jsonb) AS event_instruments,
                COALESCE(dates_list.dates, '[]'::jsonb) AS event_dates,
                COALESCE(media_list.event_media, '[]'::jsonb) AS event_media,

                (ev.is_active AND MAX(DATE(ed_all.end_date)) < CURRENT_DATE) AS is_event_completed

            FROM events ev
            LEFT JOIN event_edition ed ON ev.id_edition = ed.id
            LEFT JOIN sys_event_edition et ON ed.id_edition_type = et.id
            LEFT JOIN sys_event_domain edom ON ev.id_event_domain = edom.id
            LEFT JOIN sys_event_type etyp ON ev.id_event_type = etyp.id
            LEFT JOIN event_dates ed_all ON ed_all.id_event = ev.id

            -- ARTISTS
            LEFT JOIN LATERAL (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'id_artist', a.id,
                        'artist', CONCAT(a.fname, ' ', a.lname),
                        'teaser', a.teaser,
                        'short_bio', a.short_bio,
                        'photo', a.photo,
                        'credit_photo', a.credit_photo,
                        'artist_media', COALESCE(artist_media_list.artist_media, '[]'::jsonb)
                    )
                ), '[]'::jsonb) AS artists
                FROM event_artists ea
                LEFT JOIN artists a ON ea.id_artist = a.id
                LEFT JOIN LATERAL (
                    SELECT COALESCE(jsonb_agg(
                        jsonb_build_object(
                            'title', am.title,
                            'image', am.image,
                            'description', am.description,
                            'url', am.url
                        )
                    ), '[]'::jsonb) AS artist_media
                    FROM artist_media am
                    WHERE am.id_artist = a.id
                ) AS artist_media_list ON true
                WHERE ea.id_event = ev.id
            ) AS artists_list ON true

            -- INSTRUMENTS
            LEFT JOIN LATERAL (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object('name', i.name)
                ), '[]'::jsonb) AS instruments
                FROM event_instruments ei
                INNER JOIN sys_instruments i ON ei.id_instrument = i.id
                WHERE ei.id_event = ev.id
            ) AS instruments_list ON true

            -- DATES
            LEFT JOIN LATERAL (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'date', date_series.date,
                        'time', TO_CHAR(ed.time, 'HH24:MI'),
                        'location', l.name,
                        'id_location', ed.id_location
                    )
                ), '[]'::jsonb) AS dates
                FROM event_dates ed
                LEFT JOIN locations l ON ed.id_location = l.id
                LEFT JOIN LATERAL (
                    SELECT date::date
                    FROM generate_series(
                        DATE(ed.start_date),
                        DATE(ed.end_date),
                        interval '1 day'
                    ) AS date
                ) AS date_series ON true
                WHERE ed.id_event = ev.id
            ) AS dates_list ON true

            -- EVENT MEDIA
            LEFT JOIN LATERAL (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'title', em.title,
                        'image', em.image,
                        'description', em.description,
                        'url', em.url
                    )
                ), '[]'::jsonb) AS event_media
                FROM event_media em
                WHERE em.id_event = ev.id
            ) AS media_list ON true

            WHERE (p_event_id IS NULL OR ev.id = p_event_id)
            GROUP BY 
                ev.id, ed.name, ed.year, et.name, edom.name, etyp.name,
                artists_list.artists, instruments_list.instruments,
                dates_list.dates, media_list.event_media
            ORDER BY 
                is_event_completed ASC,
                earliest_date ASC
        ) AS event_data
    );
END;
$$;


--
-- Name: get_single_events_with_details_host_v1(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_single_events_with_details_host_v1(p_event_id integer DEFAULT NULL::integer) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', event_data.id,
                'title', event_data.title,
                'id_edition', event_data.id_edition,
                'edition', event_data.edition,
                'edition_type', event_data.edition_type,
                'id_event_domain', event_data.id_event_domain,
                'event_domain', event_data.event_domain,
                'id_event_type', event_data.id_event_type,
                'event_type', event_data.event_type,
                'teaser', event_data.teaser,
                'long_teaser', event_data.long_teaser,
                'description', event_data.description,
                'booking_url', event_data.booking_url,
                'credit_photo', event_data.credit_photo,
                'photo', event_data.photo,
                'is_active', event_data.is_active,
                'is_completed', event_data.all_dates_passed,

                -- NEW FIELDS
                'is_period', event_data.is_period,
                'period', event_data.period,

                'event_artists', event_data.event_artists,
                'event_instruments', event_data.event_instruments,
                'event_dates', event_data.event_dates,
                'event_media', event_data.event_media
            )
        )
        FROM (
            SELECT 
                ev.id,
                ev.title,
                ev.id_edition,
                CONCAT(ed.name, ' ', ed.year) AS edition,
                et.name AS edition_type,
                ev.id_event_domain,
                edom.name AS event_domain,
                ev.id_event_type,
                etyp.name AS event_type,
                ev.teaser,
                ev.long_teaser,
                ev.description,
                ev.booking_url,
                ev.credit_photo,
                ev.photo,
                ev.is_active,

                (MAX(DATE(ed_all.end_date)) < CURRENT_DATE) AS all_dates_passed,

                MIN(DATE(ed_all.start_date)) AS earliest_date,

                COALESCE(artists_list.artists, '[]'::jsonb) AS event_artists,
                COALESCE(instruments_list.instruments, '[]'::jsonb) AS event_instruments,

                COALESCE(dates_list.dates, '[]'::jsonb) AS event_dates,
                COALESCE(media_list.event_media, '[]'::jsonb) AS event_media,

                -- FIXED is_period LOGIC
                CASE 
                    WHEN period_list.period IS NOT NULL 
                         AND jsonb_array_length(period_list.period) > 0 
                    THEN TRUE 
                    ELSE FALSE 
                END AS is_period,

                -- PERIOD ARRAY
                COALESCE(period_list.period, '[]'::jsonb) AS period,

                (ev.is_active AND MAX(DATE(ed_all.end_date)) < CURRENT_DATE) AS is_event_completed

            FROM events ev
            LEFT JOIN event_edition ed ON ev.id_edition = ed.id
            LEFT JOIN sys_event_edition et ON ed.id_edition_type = et.id
            LEFT JOIN sys_event_domain edom ON ev.id_event_domain = edom.id
            LEFT JOIN sys_event_type etyp ON ev.id_event_type = etyp.id
            LEFT JOIN event_dates ed_all ON ed_all.id_event = ev.id

            -- ARTISTS
            LEFT JOIN LATERAL (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'id_artist', a.id,
                        'artist', CONCAT(a.fname, ' ', a.lname),
                        'teaser', a.teaser,
                        'short_bio', a.short_bio,
                        'photo', a.photo,
                        'credit_photo', a.credit_photo,
                        'artist_media', COALESCE(artist_media_list.artist_media, '[]'::jsonb)
                    )
                ), '[]'::jsonb) AS artists
                FROM event_artists ea
                LEFT JOIN artists a ON ea.id_artist = a.id
                LEFT JOIN LATERAL (
                    SELECT COALESCE(jsonb_agg(
                        jsonb_build_object(
                            'title', am.title,
                            'image', am.image,
                            'description', am.description,
                            'url', am.url
                        )
                    ), '[]'::jsonb) AS artist_media
                    FROM artist_media am
                    WHERE am.id_artist = a.id
                ) AS artist_media_list ON true
                WHERE ea.id_event = ev.id
            ) AS artists_list ON true

            -- INSTRUMENTS
            LEFT JOIN LATERAL (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object('name', i.name)
                ), '[]'::jsonb) AS instruments
                FROM event_instruments ei
                INNER JOIN sys_instruments i ON ei.id_instrument = i.id
                WHERE ei.id_event = ev.id
            ) AS instruments_list ON true

            -- PERIOD DATES (flag = 'p')
            LEFT JOIN LATERAL (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'start_date', edp.start_date,
                        'end_date', edp.end_date,
                        'time', TO_CHAR(edp.time, 'HH24:MI'),
                        'location', l.name,
                        'id_location', edp.id_location
                    )
                ), '[]'::jsonb) AS period
                FROM event_dates edp
                LEFT JOIN locations l ON edp.id_location = l.id
                WHERE edp.id_event = ev.id
                  AND edp.flag = 'p'
            ) AS period_list ON true

            -- DAILY DATES (flag = 'd')
            LEFT JOIN LATERAL (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'date', date_series.date,
                        'time', TO_CHAR(ed.time, 'HH24:MI'),
                        'location', l.name,
                        'id_location', ed.id_location
                    )
                ), '[]'::jsonb) AS dates
                FROM event_dates ed
                LEFT JOIN locations l ON ed.id_location = l.id
                LEFT JOIN LATERAL (
                    SELECT date::date
                    FROM generate_series(
                        DATE(ed.start_date),
                        DATE(ed.end_date),
                        interval '1 day'
                    ) AS date
                ) AS date_series ON true
                WHERE ed.id_event = ev.id
                  AND ed.flag = 'd'
            ) AS dates_list ON true

            -- EVENT MEDIA
            LEFT JOIN LATERAL (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'title', em.title,
                        'image', em.image,
                        'description', em.description,
                        'url', em.url
                    )
                ), '[]'::jsonb) AS event_media
                FROM event_media em
                WHERE em.id_event = ev.id
            ) AS media_list ON true

            WHERE (p_event_id IS NULL OR ev.id = p_event_id)

            GROUP BY 
                ev.id, ed.name, ed.year, et.name, edom.name, etyp.name,
                artists_list.artists, instruments_list.instruments,
                dates_list.dates, media_list.event_media,
                period_list.period

            ORDER BY 
                is_event_completed ASC,
                earliest_date ASC
        ) AS event_data
    );
END;
$$;


--
-- Name: get_single_events_with_details_v1(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_single_events_with_details_v1(p_event_id integer DEFAULT NULL::integer) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', event_data.id,
                'title', event_data.title,
                'id_edition', event_data.id_edition,
                'edition', event_data.edition,
                'edition_type', event_data.edition_type,
                'id_event_domain', event_data.id_event_domain,
                'event_domain', event_data.event_domain,
                'id_event_type', event_data.id_event_type,
                'event_type', event_data.event_type,
                'teaser', event_data.teaser,
                'long_teaser', event_data.long_teaser,
                'description', event_data.description,
                'booking_url', event_data.booking_url,
                'credit_photo', event_data.credit_photo,
                'photo', event_data.photo,
                'is_active', event_data.is_active,
                'is_completed', event_data.all_dates_passed,

                -- NEW FIELDS
                'is_period', event_data.is_period,
                'period', event_data.period,

                'event_artists', event_data.event_artists,
                'event_instruments', event_data.event_instruments,
                'event_dates', event_data.event_dates,
                'event_media', event_data.event_media
            )
        )
        FROM (
            SELECT 
                ev.id,
                ev.title,
                ev.id_edition,
                CONCAT(ed.name, ' ', ed.year) AS edition,
                et.name AS edition_type,
                ev.id_event_domain,
                edom.name AS event_domain,
                ev.id_event_type,
                etyp.name AS event_type,
                ev.teaser,
                ev.long_teaser,
                ev.description,
                ev.booking_url,
                ev.credit_photo,
                ev.photo,
                ev.is_active,

                (MAX(DATE(edates_all.end_date)) < CURRENT_DATE) AS all_dates_passed,
                MIN(DATE(edates_all.start_date)) AS earliest_date,

                COALESCE(artists_list.artists, '[]'::jsonb) AS event_artists,
                COALESCE(instruments_list.instruments, '[]'::jsonb) AS event_instruments,
                COALESCE(dates_list.dates, '[]'::jsonb) AS event_dates,
                COALESCE(media_list.event_media, '[]'::jsonb) AS event_media,

                -- NEW: PERIOD LOGIC
                CASE 
                    WHEN period_list.period IS NOT NULL 
                         AND jsonb_array_length(period_list.period) > 0 
                    THEN TRUE 
                    ELSE FALSE 
                END AS is_period,

                COALESCE(period_list.period, '[]'::jsonb) AS period,

                (ev.is_active AND MAX(DATE(edates_all.end_date)) < CURRENT_DATE) AS is_event_completed

            FROM events ev
            LEFT JOIN event_edition ed ON ev.id_edition = ed.id
            LEFT JOIN sys_event_edition et ON ed.id_edition_type = et.id
            LEFT JOIN sys_event_domain edom ON ev.id_event_domain = edom.id
            LEFT JOIN sys_event_type etyp ON ev.id_event_type = etyp.id
            LEFT JOIN event_dates edates_all ON edates_all.id_event = ev.id

            -- ARTISTS
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id_artist', a.id,
                        'artist', CONCAT(a.fname, ' ', a.lname),
                        'teaser', a.teaser,
                        'short_bio', a.short_bio,
                        'photo', a.photo,
                        'credit_photo', a.credit_photo,
                        'artist_media', COALESCE(artist_media_list.artist_media, '[]'::jsonb)
                    )
                ) AS artists
                FROM event_artists ea
                LEFT JOIN artists a ON ea.id_artist = a.id
                LEFT JOIN LATERAL (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'title', am.title,
                            'image', am.image,
                            'description', am.description,
                            'url', am.url
                        )
                    ) AS artist_media
                    FROM artist_media am
                    WHERE am.id_artist = a.id
                ) AS artist_media_list ON true
                WHERE ea.id_event = ev.id
            ) AS artists_list ON true

            -- INSTRUMENTS
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object('name', i.name)
                ) AS instruments
                FROM event_instruments ei
                INNER JOIN sys_instruments i ON ei.id_instrument = i.id
                WHERE ei.id_event = ev.id
            ) AS instruments_list ON true

            -- NEW: PERIOD (flag = 'p')
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'start_date', edp.start_date,
                        'end_date', edp.end_date,
                        'time', TO_CHAR(edp.time, 'HH24:MI'),
                        'location', l.name,
                        'id_location', edp.id_location
                    )
                ) AS period
                FROM event_dates edp
                LEFT JOIN locations l ON edp.id_location = l.id
                WHERE edp.id_event = ev.id
                  AND edp.flag = 'p'
            ) AS period_list ON true

            -- DAILY DATES (flag = 'd')
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'date', date_series.date,
                        'time', TO_CHAR(edates.time, 'HH24:MI'),
                        'location', l.name,
                        'id_location', edates.id_location
                    )
                ) AS dates
                FROM event_dates edates
                LEFT JOIN locations l ON edates.id_location = l.id
                CROSS JOIN generate_series(
                    DATE(edates.start_date),
                    DATE(edates.end_date),
                    '1 day'
                ) AS date_series(date)
                WHERE edates.id_event = ev.id
                  AND edates.flag = 'd'
            ) AS dates_list ON true

            -- MEDIA
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'title', em.title,
                        'image', em.image,
                        'description', em.description,
                        'url', em.url
                    )
                ) AS event_media
                FROM event_media em
                WHERE em.id_event = ev.id
            ) AS media_list ON true

            WHERE (p_event_id IS NULL OR ev.id = p_event_id)
            GROUP BY ev.id, ed.name, ed.year, et.name, edom.name, etyp.name,
                     artists_list.artists, instruments_list.instruments,
                     dates_list.dates, media_list.event_media,
                     period_list.period
            ORDER BY is_event_completed ASC, earliest_date ASC
        ) AS event_data
    );
END;
$$;


--
-- Name: get_single_request_with_details(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_single_request_with_details(p_event_id integer DEFAULT NULL::integer) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', event_data.id,
                'title', event_data.title,
                'id_edition', event_data.id_edition,
                'edition', event_data.edition,
                'edition_type', event_data.edition_type,
                'id_event_domain', event_data.id_event_domain,
                'event_domain', event_data.event_domain,
                'id_event_type', event_data.id_event_type,
                'event_type', event_data.event_type,
                'teaser', event_data.teaser,
                'long_teaser', event_data.long_teaser,
                'description', event_data.description,
                'booking_url', event_data.booking_url,
                'credit_photo', event_data.credit_photo,
                'photo', event_data.photo,
                'is_active', event_data.is_active,
                'is_completed', event_data.all_dates_passed,
                'event_artists', event_data.event_artists,
                'event_instruments', event_data.event_instruments,
                'event_dates', event_data.event_dates,
                'event_media', event_data.event_media,
				'status', event_data.status,
				'comments',event_data.comments
            )
        )
        FROM (
            SELECT 
                ev.id,
                ev.title,
                ev.id_edition,
                CONCAT(ed.name, ' ', ed.year) as edition,
                et.name as edition_type,
                ev.id_event_domain,
                edom.name as event_domain,
                ev.id_event_type,
                etyp.name as event_type,
                ev.teaser,
                ev.long_teaser,
                ev.description,
                ev.booking_url,
                ev.credit_photo,
                ev.photo,
                ev.is_active,
				ev.status,
				ev.comments,
                -- Check if all event date ranges have passed
                (MAX(DATE(edates_all.end_date)) < CURRENT_DATE) as all_dates_passed,
                MIN(DATE(edates_all.start_date)) as earliest_date, -- For sorting
                COALESCE(artists_list.artists, '[]'::jsonb) as event_artists,
                COALESCE(instruments_list.instruments, '[]'::jsonb) as event_instruments,
                COALESCE(dates_list.dates, '[]'::jsonb) as event_dates,
                COALESCE(media_list.event_media, '[]'::jsonb) as event_media,
                -- Add the completion status for sorting
                (ev.is_active AND MAX(DATE(edates_all.end_date)) < CURRENT_DATE) as is_event_completed
            FROM events ev
            LEFT JOIN event_edition ed ON ev.id_edition = ed.id
            LEFT JOIN sys_event_edition et ON ed.id_edition_type = et.id
            LEFT JOIN sys_event_domain edom ON ev.id_event_domain = edom.id
            LEFT JOIN sys_event_type etyp ON ev.id_event_type = etyp.id
            LEFT JOIN event_dates edates_all ON edates_all.id_event = ev.id
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
						'id_artist', a.id,
                        'artist', CONCAT(a.fname, ' ', a.lname),
                        'teaser', a.teaser,
						'short_bio', a.short_bio,
                        'photo', a.photo,
                        'credit_photo', a.credit_photo,
                        'artist_media', COALESCE(artist_media_list.artist_media, '[]'::jsonb)
                    )
                ) AS artists
                FROM event_artists ea
                LEFT JOIN artists a ON ea.id_artist = a.id
                LEFT JOIN LATERAL (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'title', am.title,
                            'image', am.image,
                            'description', am.description,
                            'url', am.url
                        )
                    ) AS artist_media
                    FROM artist_media am
                    WHERE am.id_artist = a.id
                ) AS artist_media_list ON true
                WHERE ea.id_event = ev.id
            ) AS artists_list ON true
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object('name', i.name)
                ) AS instruments
                FROM event_instruments ei
                INNER JOIN sys_instruments i ON ei.id_instrument = i.id
                WHERE ei.id_event = ev.id
            ) AS instruments_list ON true
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'date', date_series.date,
                        'time', TO_CHAR(edates.time, 'HH24:MI'),
                        'location', l.name,
						'id_location', edates.id_location
                    )
                ) AS dates
                FROM event_dates edates
                LEFT JOIN locations l ON edates.id_location = l.id
                CROSS JOIN generate_series(
                    DATE(edates.start_date),
                    DATE(edates.end_date),
                    '1 day'::interval
                ) AS date_series(date)
                WHERE edates.id_event = ev.id
                  AND (p_event_id IS NULL OR ev.id = p_event_id)
                  AND date_series.date >= DATE_TRUNC('month', CURRENT_DATE)
            ) AS dates_list ON true
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'title', em.title,
                        'image', em.image,
                        'description', em.description,
                        'url', em.url
                    )
                ) AS event_media
                FROM event_media em
                WHERE em.id_event = ev.id
            ) AS media_list ON true
            WHERE dates_list.dates IS NOT NULL -- Only include events that have at least one valid date
              AND (p_event_id IS NULL OR ev.id = p_event_id)
            GROUP BY ev.id, ed.name, ed.year, et.name, edom.name, etyp.name, 
                     artists_list.artists, instruments_list.instruments, dates_list.dates, media_list.event_media
            ORDER BY (ev.is_active AND MAX(DATE(edates_all.end_date)) < CURRENT_DATE) ASC,
                     MIN(DATE(edates_all.start_date)) ASC
        ) AS event_data
    );
END;
$$;


--
-- Name: get_single_request_with_details_v1(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_single_request_with_details_v1(p_event_id integer DEFAULT NULL::integer) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', event_data.id,
                'title', event_data.title,
                'id_edition', event_data.id_edition,
                'edition', event_data.edition,
                'edition_type', event_data.edition_type,
                'id_event_domain', event_data.id_event_domain,
                'event_domain', event_data.event_domain,
                'id_event_type', event_data.id_event_type,
                'event_type', event_data.event_type,
                'teaser', event_data.teaser,
                'long_teaser', event_data.long_teaser,
                'description', event_data.description,
                'booking_url', event_data.booking_url,
                'credit_photo', event_data.credit_photo,
                'photo', event_data.photo,
                'is_active', event_data.is_active,
                'is_completed', event_data.all_dates_passed,
                'event_artists', event_data.event_artists,
                'event_instruments', event_data.event_instruments,
                'event_dates', event_data.event_dates,
                'event_media', event_data.event_media,
                'status', event_data.status,
                'comments', event_data.event_comments  -- <-- Added
            )
        )
        FROM (
            SELECT 
                ev.id,
                ev.title,
                ev.id_edition,
                CONCAT(ed.name, ' ', ed.year) as edition,
                et.name as edition_type,
                ev.id_event_domain,
                edom.name as event_domain,
                ev.id_event_type,
                etyp.name as event_type,
                ev.teaser,
                ev.long_teaser,
                ev.description,
                ev.booking_url,
                ev.credit_photo,
                ev.photo,
                ev.is_active,
                ev.status,
                -- Completion logic
                (MAX(DATE(edates_all.end_date)) < CURRENT_DATE) as all_dates_passed,
                MIN(DATE(edates_all.start_date)) as earliest_date,
                COALESCE(artists_list.artists, '[]'::jsonb) as event_artists,
                COALESCE(instruments_list.instruments, '[]'::jsonb) as event_instruments,
                COALESCE(dates_list.dates, '[]'::jsonb) as event_dates,
                COALESCE(media_list.event_media, '[]'::jsonb) as event_media,
                COALESCE(comments_list.event_comments, '[]'::jsonb) as event_comments,  -- <-- Added
                (ev.is_active AND MAX(DATE(edates_all.end_date)) < CURRENT_DATE) as is_event_completed
            FROM events ev
            LEFT JOIN event_edition ed ON ev.id_edition = ed.id
            LEFT JOIN sys_event_edition et ON ed.id_edition_type = et.id
            LEFT JOIN sys_event_domain edom ON ev.id_event_domain = edom.id
            LEFT JOIN sys_event_type etyp ON ev.id_event_type = etyp.id
            LEFT JOIN event_dates edates_all ON edates_all.id_event = ev.id
            -- Artists
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id_artist', a.id,
                        'artist', CONCAT(a.fname, ' ', a.lname),
                        'teaser', a.teaser,
                        'short_bio', a.short_bio,
                        'photo', a.photo,
                        'credit_photo', a.credit_photo,
                        'artist_media', COALESCE(artist_media_list.artist_media, '[]'::jsonb)
                    )
                ) AS artists
                FROM event_artists ea
                LEFT JOIN artists a ON ea.id_artist = a.id
                LEFT JOIN LATERAL (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'title', am.title,
                            'image', am.image,
                            'description', am.description,
                            'url', am.url
                        )
                    ) AS artist_media
                    FROM artist_media am
                    WHERE am.id_artist = a.id
                ) AS artist_media_list ON true
                WHERE ea.id_event = ev.id
            ) AS artists_list ON true
            -- Instruments
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object('name', i.name)
                ) AS instruments
                FROM event_instruments ei
                INNER JOIN sys_instruments i ON ei.id_instrument = i.id
                WHERE ei.id_event = ev.id
            ) AS instruments_list ON true
            -- Dates (filtered to future + current month onward)
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'date', date_series.date,
                        'time', TO_CHAR(edates.time, 'HH24:MI'),
                        'location', l.name,
                        'id_location', edates.id_location
                    )
                ) AS dates
                FROM event_dates edates
                LEFT JOIN locations l ON edates.id_location = l.id
                CROSS JOIN generate_series(
                    DATE(edates.start_date),
                    DATE(edates.end_date),
                    '1 day'::interval
                ) AS date_series(date)
                WHERE edates.id_event = ev.id
                  AND (p_event_id IS NULL OR ev.id = p_event_id)
                  AND date_series.date >= DATE_TRUNC('month', CURRENT_DATE)
            ) AS dates_list ON true
            -- Event Media
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'title', em.title,
                        'image', em.image,
                        'description', em.description,
                        'url', em.url
                    )
                ) AS event_media
                FROM event_media em
                WHERE em.id_event = ev.id
            ) AS media_list ON true
            -- Event Comments (NEW)
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', ec.id,
                        'id_host', ec.id_host,
                        'host', h.name,
                        'id_artist', ec.id_artist,
                        'artist', CONCAT(a.fname, ' ', a.lname),
                        'id_profile', a.id_profile,
                        'comment', ec.comment,
                        'who', ec.who,
                        'dated', ec.dated
                    )
                ) AS event_comments
                FROM event_comments ec
                LEFT JOIN hosts h ON ec.id_host = h.id
                LEFT JOIN artists a ON ec.id_artist = a.id
                WHERE ec.id_event = ev.id
            ) AS comments_list ON true
            -- Filter: only events with valid upcoming/present dates
            WHERE dates_list.dates IS NOT NULL
              AND (p_event_id IS NULL OR ev.id = p_event_id)
            GROUP BY 
                ev.id, ed.name, ed.year, et.name, edom.name, etyp.name,
                artists_list.artists, instruments_list.instruments,
                dates_list.dates, media_list.event_media, comments_list.event_comments
            ORDER BY 
                (ev.is_active AND MAX(DATE(edates_all.end_date)) < CURRENT_DATE) ASC,
                MIN(DATE(edates_all.start_date)) ASC
        ) AS event_data
    );
END;
$$;


--
-- Name: get_single_request_with_details_v2(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_single_request_with_details_v2(p_event_id integer DEFAULT NULL::integer) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', event_data.id,
                'title', event_data.title,
                'id_edition', event_data.id_edition,
                'edition', event_data.edition,
                'edition_type', event_data.edition_type,
                'id_event_domain', event_data.id_event_domain,
                'event_domain', event_data.event_domain,
                'id_event_type', event_data.id_event_type,
                'event_type', event_data.event_type,
                'teaser', event_data.teaser,
                'long_teaser', event_data.long_teaser,
                'description', event_data.description,
                'booking_url', event_data.booking_url,
                'credit_photo', event_data.credit_photo,
                'photo', event_data.photo,
                'is_active', event_data.is_active,
                'is_completed', event_data.all_dates_passed,

                -- NEW FIELDS (from reference)
                'is_period', event_data.is_period,
                'period', event_data.period,

                'event_artists', event_data.event_artists,
                'event_instruments', event_data.event_instruments,
                'event_dates', event_data.event_dates,
                'event_media', event_data.event_media,
                'status', event_data.status,
                'comments', event_data.event_comments
            )
        )
        FROM (
            SELECT 
                ev.id,
                ev.title,
                ev.id_edition,
                CONCAT(ed.name, ' ', ed.year) as edition,
                et.name as edition_type,
                ev.id_event_domain,
                edom.name as event_domain,
                ev.id_event_type,
                etyp.name as event_type,
                ev.teaser,
                ev.long_teaser,
                ev.description,
                ev.booking_url,
                ev.credit_photo,
                ev.photo,
                ev.is_active,
                ev.status,

                -- Completion logic
                (MAX(DATE(edates_all.end_date)) < CURRENT_DATE) as all_dates_passed,
                MIN(DATE(edates_all.start_date)) as earliest_date,

                -- Artists (unchanged)
                COALESCE(artists_list.artists, '[]'::jsonb) as event_artists,
                COALESCE(instruments_list.instruments, '[]'::jsonb) as event_instruments,

                -- DAILY DATES (flag = 'd') — kept as `event_dates`
                COALESCE(daily_dates_list.dates, '[]'::jsonb) as event_dates,

                -- PERIOD DATES (flag = 'p') → new `period` field
                COALESCE(period_list.period, '[]'::jsonb) as period,
                CASE 
                    WHEN period_list.period IS NOT NULL 
                         AND jsonb_array_length(period_list.period) > 0 
                    THEN TRUE 
                    ELSE FALSE 
                END AS is_period,

                -- Media & Comments (unchanged)
                COALESCE(media_list.event_media, '[]'::jsonb) as event_media,
                COALESCE(comments_list.event_comments, '[]'::jsonb) as event_comments,

                (ev.is_active AND MAX(DATE(edates_all.end_date)) < CURRENT_DATE) as is_event_completed

            FROM events ev
            LEFT JOIN event_edition ed ON ev.id_edition = ed.id
            LEFT JOIN sys_event_edition et ON ed.id_edition_type = et.id
            LEFT JOIN sys_event_domain edom ON ev.id_event_domain = edom.id
            LEFT JOIN sys_event_type etyp ON ev.id_event_type = etyp.id
            LEFT JOIN event_dates edates_all ON edates_all.id_event = ev.id

            -- Artists
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id_artist', a.id,
                        'artist', CONCAT(a.fname, ' ', a.lname),
                        'teaser', a.teaser,
                        'short_bio', a.short_bio,
                        'photo', a.photo,
                        'credit_photo', a.credit_photo,
                        'artist_media', COALESCE(artist_media_list.artist_media, '[]'::jsonb)
                    )
                ) AS artists
                FROM event_artists ea
                LEFT JOIN artists a ON ea.id_artist = a.id
                LEFT JOIN LATERAL (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'title', am.title,
                            'image', am.image,
                            'description', am.description,
                            'url', am.url
                        )
                    ) AS artist_media
                    FROM artist_media am
                    WHERE am.id_artist = a.id
                ) AS artist_media_list ON true
                WHERE ea.id_event = ev.id
            ) AS artists_list ON true

            -- Instruments
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object('name', i.name)
                ) AS instruments
                FROM event_instruments ei
                INNER JOIN sys_instruments i ON ei.id_instrument = i.id
                WHERE ei.id_event = ev.id
            ) AS instruments_list ON true

            -- ✅ PERIOD DATES (flag = 'p')
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'start_date', edp.start_date,
                        'end_date', edp.end_date,
                        'time', TO_CHAR(edp.time, 'HH24:MI'),
                        'location', l.name,
                        'id_location', edp.id_location
                    )
                ) AS period
                FROM event_dates edp
                LEFT JOIN locations l ON edp.id_location = l.id
                WHERE edp.id_event = ev.id
                  AND edp.flag = 'p'
            ) AS period_list ON true

            -- ✅ DAILY DATES (flag = 'd') → now separate from period
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'date', date_series.date,
                        'time', TO_CHAR(ed.time, 'HH24:MI'),
                        'location', l.name,
                        'id_location', ed.id_location
                    )
                ) AS dates
                FROM event_dates ed
                LEFT JOIN locations l ON ed.id_location = l.id
                CROSS JOIN generate_series(
                    DATE(ed.start_date),
                    DATE(ed.end_date),
                    '1 day'::interval
                ) AS date_series(date)
                WHERE ed.id_event = ev.id
                  AND ed.flag = 'd'
                  AND (p_event_id IS NULL OR ev.id = p_event_id)
                  AND date_series.date >= DATE_TRUNC('month', CURRENT_DATE)
            ) AS daily_dates_list ON true

            -- Event Media
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'title', em.title,
                        'image', em.image,
                        'description', em.description,
                        'url', em.url
                    )
                ) AS event_media
                FROM event_media em
                WHERE em.id_event = ev.id
            ) AS media_list ON true

            -- Event Comments
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', ec.id,
                        'id_host', ec.id_host,
                        'host', h.name,
                        'id_artist', ec.id_artist,
                        'artist', CONCAT(a.fname, ' ', a.lname),
                        'id_profile', a.id_profile,
                        'comment', ec.comment,
                        'who', ec.who,
                        'dated', ec.dated
                    )
                ) AS event_comments
                FROM event_comments ec
                LEFT JOIN hosts h ON ec.id_host = h.id
                LEFT JOIN artists a ON ec.id_artist = a.id
                WHERE ec.id_event = ev.id
            ) AS comments_list ON true

            -- Filter: keep only events with either daily or period dates (or both)
            WHERE 
                (daily_dates_list.dates IS NOT NULL OR period_list.period IS NOT NULL)
                AND (p_event_id IS NULL OR ev.id = p_event_id)

            GROUP BY 
                ev.id, ed.name, ed.year, et.name, edom.name, etyp.name,
                artists_list.artists, instruments_list.instruments,
                daily_dates_list.dates, media_list.event_media, 
                period_list.period, comments_list.event_comments

            ORDER BY 
                (ev.is_active AND MAX(DATE(edates_all.end_date)) < CURRENT_DATE) ASC,
                MIN(DATE(edates_all.start_date)) ASC
        ) AS event_data
    );
END;
$$;


--
-- Name: get_unassigned_performance_types(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_unassigned_performance_types(artist_id integer) RETURNS TABLE(id integer, name text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT sap.id, sap.name
    FROM sys_artist_performance sap
    WHERE NOT EXISTS (
        SELECT 1
        FROM artist_performance ap
        WHERE ap.id_artist = artist_id
          AND ap.id_performance = sap.id
    );
END;
$$;


--
-- Name: get_unassigned_performance_types_v1(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_unassigned_performance_types_v1(artist_id integer) RETURNS TABLE(id integer, name text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT sap.id, sap.name
    FROM sys_artist_performance sap
    WHERE NOT EXISTS (
        SELECT 1
        FROM artist_performance ap
        WHERE ap.id_artist = artist_id
          AND ap.id_performance = sap.id
    );
END;
$$;


--
-- Name: get_upcoming_events(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_upcoming_events() RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', event_data.id,
                'title', event_data.title,
                'id_edition', event_data.id_edition,
                'edition', event_data.edition,
                'edition_type', event_data.edition_type,
                'id_event_domain', event_data.id_event_domain,
                'event_domain', event_data.event_domain,
                'id_event_type', event_data.id_event_type,
                'event_type', event_data.event_type,
                'teaser', event_data.teaser,
                'photo', event_data.photo,
                'is_active', event_data.is_active,
                'event_artists', event_data.event_artists,
                'event_instruments', event_data.event_instruments,
                'event_dates', event_data.event_dates
            )
            ORDER BY event_data.earliest_date ASC  -- optional: ensure outer events sorted too
        )
        FROM (
            SELECT 
                ev.id,
                ev.title,
                ev.id_edition,
                CONCAT(ed.name, ' ', ed.year) AS edition,
                et.name AS edition_type,
                ev.id_event_domain,
                edom.name AS event_domain,
                ev.id_event_type,
                etyp.name AS event_type,
                ev.teaser,
                ev.photo,
                ev.is_active,
                MIN(DATE(edates_all.start_date)) AS earliest_date,
                MAX(DATE(edates_all.end_date)) AS latest_date,
                COALESCE(artists_list.artists, '[]'::jsonb) AS event_artists,
                COALESCE(instruments_list.instruments, '[]'::jsonb) AS event_instruments,
                COALESCE(dates_list.dates, '[]'::jsonb) AS event_dates
            FROM events ev
            LEFT JOIN event_edition ed ON ev.id_edition = ed.id
            LEFT JOIN sys_event_edition et ON ed.id_edition_type = et.id
            LEFT JOIN sys_event_domain edom ON ev.id_event_domain = edom.id
            LEFT JOIN sys_event_type etyp ON ev.id_event_type = etyp.id
            LEFT JOIN event_dates edates_all ON edates_all.id_event = ev.id

            -- 🎵 Artists list
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object('artist', CONCAT(a.fname, ' ', a.lname))
                ) AS artists
                FROM event_artists ea
                LEFT JOIN artists a ON ea.id_artist = a.id
                WHERE ea.id_event = ev.id
            ) AS artists_list ON true

            -- 🎸 Instruments list
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object('name', i.name)
                ) AS instruments
                FROM event_instruments ei
                INNER JOIN sys_instruments i ON ei.id_instrument = i.id
                WHERE ei.id_event = ev.id
            ) AS instruments_list ON true

            -- 📅 Dates list (ordered by date)
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'date', date_series.date,
                        'time', TO_CHAR(edates.time, 'HH24:MI'),
                        'location', l.name
                    )
                    ORDER BY date_series.date ASC  -- ✅ Sort earliest first
                ) AS dates
                FROM event_dates edates
                LEFT JOIN locations l ON edates.id_location = l.id
                CROSS JOIN generate_series(
                    DATE(edates.start_date),
                    DATE(edates.end_date),
                    '1 day'::interval
                ) AS date_series(date)
                WHERE edates.id_event = ev.id
                  AND edates.end_date > CURRENT_DATE  -- only future events
            ) AS dates_list ON true

            GROUP BY ev.id, ed.name, ed.year, et.name, edom.name, etyp.name,
                     artists_list.artists, instruments_list.instruments, dates_list.dates
            HAVING MAX(DATE(edates_all.end_date)) > CURRENT_DATE
            ORDER BY MIN(DATE(edates_all.start_date)) ASC
        ) AS event_data
    );
END;
$$;


--
-- Name: get_upcoming_events_v1(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_upcoming_events_v1() RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', event_data.id,
                'title', event_data.title,
                'id_edition', event_data.id_edition,
                'edition', event_data.edition,
                'edition_type', event_data.edition_type,
                'id_event_domain', event_data.id_event_domain,
                'event_domain', event_data.event_domain,
                'id_event_type', event_data.id_event_type,
                'event_type', event_data.event_type,
                'teaser', event_data.teaser,
                'photo', event_data.photo,
                'is_active', event_data.is_active,
                'event_artists', event_data.event_artists,
                'event_instruments', event_data.event_instruments,
                'event_dates', jsonb_build_object(
                    'is_period', event_data.is_period,
                    'dates', event_data.date_list,
                    'period', event_data.period_list
                )
            )
            ORDER BY event_data.earliest_date ASC
        )
        FROM (
            SELECT 
                ev.id,
                ev.title,
                ev.id_edition,
                CONCAT(ed.name, ' ', ed.year) AS edition,
                et.name AS edition_type,
                ev.id_event_domain,
                edom.name AS event_domain,
                ev.id_event_type,
                etyp.name AS event_type,
                ev.teaser,
                ev.photo,
                ev.is_active,
                MIN(ed_all.start_date) AS earliest_date,
                MAX(ed_all.end_date) AS latest_date,
                COALESCE(artists_list.artists, '[]'::jsonb) AS event_artists,
                COALESCE(instruments_list.instruments, '[]'::jsonb) AS event_instruments,
                COALESCE(dates_expanded_list.dates, '[]'::jsonb) AS date_list,
                COALESCE(period_list.period, '[]'::jsonb) AS period_list,
                CASE 
                    WHEN period_list.period IS NOT NULL 
                         AND jsonb_array_length(period_list.period) > 0
                    THEN TRUE 
                    ELSE FALSE 
                END AS is_period

            FROM events ev
            LEFT JOIN event_edition ed ON ev.id_edition = ed.id
            LEFT JOIN sys_event_edition et ON ed.id_edition_type = et.id
            LEFT JOIN sys_event_domain edom ON ev.id_event_domain = edom.id
            LEFT JOIN sys_event_type etyp ON ev.id_event_type = etyp.id
            LEFT JOIN event_dates ed_all ON ed_all.id_event = ev.id

            -- 🎵 Artists
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(jsonb_build_object('artist', CONCAT(a.fname, ' ', a.lname)))
                AS artists
                FROM event_artists ea
                LEFT JOIN artists a ON ea.id_artist = a.id
                WHERE ea.id_event = ev.id
            ) AS artists_list ON true

            -- 🎸 Instruments
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(jsonb_build_object('name', i.name)) AS instruments
                FROM event_instruments ei
                INNER JOIN sys_instruments i ON ei.id_instrument = i.id
                WHERE ei.id_event = ev.id
            ) AS instruments_list ON true

            -- 📅 DATES (flag = 'd')
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'date', date_series.date,
                        'time', TO_CHAR(ed.time, 'HH24:MI'),
                        'location', l.name
                    ) ORDER BY date_series.date ASC
                ) AS dates
                FROM event_dates ed
                LEFT JOIN locations l ON ed.id_location = l.id
                CROSS JOIN generate_series(
                    DATE(ed.start_date),
                    DATE(ed.end_date),
                    '1 day'::interval
                ) AS date_series(date)
                WHERE ed.id_event = ev.id
                  AND ed.flag = 'd'
                  AND ed.end_date >= CURRENT_DATE
            ) AS dates_expanded_list ON true

            -- 📆 PERIODS (flag = 'p')
            LEFT JOIN LATERAL (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'start_date', ed.start_date,
                        'end_date', ed.end_date,
                        'time', TO_CHAR(ed.time, 'HH24:MI'),
                        'location', l.name
                    ) ORDER BY ed.start_date ASC
                ) AS period
                FROM event_dates ed
                LEFT JOIN locations l ON ed.id_location = l.id
                WHERE ed.id_event = ev.id
                  AND ed.flag = 'p'
                  AND ed.end_date >= CURRENT_DATE
            ) AS period_list ON true

            -- ✅ ADDED: Filter only active/published events (status = 0)
            WHERE ev.status = 0

            GROUP BY ev.id, ed.name, ed.year, et.name, edom.name, etyp.name,
                     artists_list.artists, instruments_list.instruments,
                     dates_expanded_list.dates, period_list.period

            -- Keep only events with at least one future date (already partially filtered in LATERALs)
            HAVING MAX(ed_all.end_date) >= CURRENT_DATE

            ORDER BY MIN(ed_all.start_date) ASC
        ) AS event_data
    );
END;
$$;


--
-- Name: get_upcoming_events_with_details(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_upcoming_events_with_details() RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', event_data.id,
        'title', event_data.title,
        'id_edition', event_data.id_edition,
        'edition', event_data.edition,
        'edition_type', event_data.edition_type,
        'id_event_domain', event_data.id_event_domain,
        'event_domain', event_data.event_domain,
        'id_event_type', event_data.id_event_type,
        'event_type', event_data.event_type,
        'teaser', event_data.teaser,
        'photo', event_data.photo,
        'is_active', event_data.is_active,
        'event_artists', event_data.event_artists,
        'event_instruments', event_data.event_instruments,
        'event_dates', event_data.event_dates
      )
    )
    FROM (
      SELECT 
        ev.id,
        ev.title,
        ev.id_edition,
        CONCAT(ed.name, ' ', ed.year) AS edition,
        et.name AS edition_type,
        ev.id_event_domain,
        edom.name AS event_domain,
        ev.id_event_type,
        etyp.name AS event_type,
        ev.teaser,
        ev.photo,
        ev.is_active,
        MIN(DATE(edates_all.start_date)) AS earliest_date, -- for sorting
        COALESCE(artists_list.artists, '[]'::jsonb) AS event_artists,
        COALESCE(instruments_list.instruments, '[]'::jsonb) AS event_instruments,
        COALESCE(dates_list.dates, '[]'::jsonb) AS event_dates

      FROM events ev
      LEFT JOIN event_edition ed ON ev.id_edition = ed.id
      LEFT JOIN sys_event_edition et ON ed.id_edition_type = et.id
      LEFT JOIN sys_event_domain edom ON ev.id_event_domain = edom.id
      LEFT JOIN sys_event_type etyp ON ev.id_event_type = etyp.id
      LEFT JOIN event_dates edates_all ON edates_all.id_event = ev.id

      -- 🎭 Artists list
      LEFT JOIN LATERAL (
        SELECT jsonb_agg(
          jsonb_build_object('artist', CONCAT(a.fname, ' ', a.lname))
        ) AS artists
        FROM event_artists ea
        LEFT JOIN artists a ON ea.id_artist = a.id
        WHERE ea.id_event = ev.id
      ) AS artists_list ON TRUE

      -- 🎵 Instruments list
      LEFT JOIN LATERAL (
        SELECT jsonb_agg(
          jsonb_build_object('name', i.name)
        ) AS instruments
        FROM event_instruments ei
        INNER JOIN sys_instruments i ON ei.id_instrument = i.id
        WHERE ei.id_event = ev.id
      ) AS instruments_list ON TRUE

      -- 📅 Dates list
      LEFT JOIN LATERAL (
        SELECT jsonb_agg(
          jsonb_build_object(
            'date', date_series.date,
            'time', TO_CHAR(edates.time, 'HH24:MI'),
            'location', l.name
          )
        ) AS dates
        FROM event_dates edates
        LEFT JOIN locations l ON edates.id_location = l.id
        CROSS JOIN generate_series(
          DATE(edates.start_date),
          DATE(edates.end_date),
          '1 day'::interval
        ) AS date_series(date)
        WHERE edates.id_event = ev.id
          AND date_series.date >= CURRENT_DATE  -- ✅ Only future or ongoing dates
      ) AS dates_list ON TRUE

      WHERE
        dates_list.dates IS NOT NULL  -- ✅ Include only events with upcoming dates
        AND ev.is_active = TRUE

      GROUP BY ev.id, ed.name, ed.year, et.name, edom.name, etyp.name, 
               artists_list.artists, instruments_list.instruments, dates_list.dates

      ORDER BY MIN(DATE(edates_all.start_date)) ASC
      LIMIT 10
    ) AS event_data
  );
END;
$$;


--
-- Name: pont_delete_artist(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pont_delete_artist(artist_id integer) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    artist_exists BOOLEAN;
    v_id_user uuid;
BEGIN
    SELECT EXISTS(SELECT 1 FROM artists WHERE id = artist_id) INTO artist_exists;
    IF NOT artist_exists THEN
        RETURN FALSE;
    END IF;

    v_id_user := (SELECT id_profile FROM public.artists WHERE id = artist_id);

    -- Delete related records
    DELETE FROM artist_request_media 
      WHERE id_request IN (SELECT id FROM artist_request WHERE id_artist = artist_id);

    DELETE FROM artist_request WHERE id_artist = artist_id;
    DELETE FROM event_artists WHERE id_artist = artist_id;
    DELETE FROM artist_instruments WHERE id_artist = artist_id;
    DELETE FROM artist_education WHERE id_artist = artist_id;
    DELETE FROM artist_awards WHERE id_artist = artist_id;
    DELETE FROM artist_availability WHERE id_artist = artist_id;
    DELETE FROM artist_requirement WHERE id_artist = artist_id;
    DELETE FROM artist_performance WHERE id_artist = artist_id;
    DELETE FROM artist_media WHERE id_artist = artist_id;

    DELETE FROM artists WHERE id = artist_id;
    DELETE FROM public.user_profile WHERE id_user = v_id_user;

    RETURN TRUE;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error deleting artist: %', SQLERRM;
        RETURN FALSE;
END;
$$;


--
-- Name: tjs_has_role(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tjs_has_role(check_user_id uuid, check_role_name text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$ BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tjs_user_roles ur
        JOIN tjs_roles r ON ur.role_id = r.id
        WHERE ur.user_id = check_user_id
        AND r.name = check_role_name
        AND ur.is_active = TRUE
    );
END;
 $$;


--
-- Name: tjs_is_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tjs_is_admin(check_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$ BEGIN
    RETURN tjs_has_role(check_user_id, 'Admin');
END;
 $$;


--
-- Name: tjs_remove_role(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tjs_remove_role(p_user_id uuid, p_role_name text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$ DECLARE
    v_role_id UUID;
BEGIN
    SELECT id INTO v_role_id FROM tjs_roles WHERE name = p_role_name;
    
    IF v_role_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    UPDATE tjs_user_roles
    SET is_active = FALSE
    WHERE user_id = p_user_id AND role_id = v_role_id;
    
    RETURN TRUE;
END;
 $$;


--
-- Name: tjs_sync_from_pag(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tjs_sync_from_pag(p_pag_artist_id uuid, p_profile_id uuid, p_artist_name text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$ DECLARE
    v_artist_id UUID;
BEGIN
    -- Check if artist already exists
    SELECT id INTO v_artist_id 
    FROM tjs_artists 
    WHERE profile_id = p_profile_id;
    
    IF v_artist_id IS NOT NULL THEN
        -- Update existing artist
        UPDATE tjs_artists SET
            is_pag_artist = TRUE,
            pag_artist_id = p_pag_artist_id,
            updated_at = NOW()
        WHERE id = v_artist_id;
    ELSE
        -- Create new artist
        INSERT INTO tjs_artists (
            profile_id, 
            artist_name, 
            is_pag_artist, 
            pag_artist_id,
            is_tjs_artist
        )
        VALUES (
            p_profile_id, 
            p_artist_name, 
            TRUE, 
            p_pag_artist_id,
            TRUE
        )
        RETURNING id INTO v_artist_id;
    END IF;
    
    RETURN v_artist_id;
END;
 $$;


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_
        -- Filter by action early - only get subscriptions interested in this action
        -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
        and (subs.action_filter = '*' or subs.action_filter = action::text);

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: webauthn_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    challenge_type text NOT NULL,
    session_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT webauthn_challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])))
);


--
-- Name: webauthn_credentials; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id bytea NOT NULL,
    public_key bytea NOT NULL,
    attestation_type text DEFAULT ''::text NOT NULL,
    aaguid uuid,
    sign_count bigint DEFAULT 0 NOT NULL,
    transports jsonb DEFAULT '[]'::jsonb NOT NULL,
    backup_eligible boolean DEFAULT false NOT NULL,
    backed_up boolean DEFAULT false NOT NULL,
    friendly_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


--
-- Name: artist_availability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.artist_availability (
    id integer NOT NULL,
    id_artist integer,
    start_date date,
    end_date date,
    notes text,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    last_updated timestamp without time zone,
    updated_by uuid
);


--
-- Name: artist_availability_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.artist_availability_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: artist_availability_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.artist_availability_id_seq OWNED BY public.artist_availability.id;


--
-- Name: artist_awards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.artist_awards (
    id_artist integer,
    award text,
    description text,
    year text,
    created_by uuid,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_updated_by uuid,
    id integer NOT NULL
);


--
-- Name: artist_awards_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.artist_awards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: artist_awards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.artist_awards_id_seq OWNED BY public.artist_awards.id;


--
-- Name: artist_education; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.artist_education (
    id_artist integer,
    course text,
    school text,
    year text,
    created_by uuid,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_updated_by uuid,
    id integer NOT NULL
);


--
-- Name: artist_education_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.artist_education_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: artist_education_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.artist_education_id_seq OWNED BY public.artist_education.id;


--
-- Name: artist_instruments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.artist_instruments (
    id integer NOT NULL,
    id_instrument integer,
    created_by uuid,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_update timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by uuid,
    id_artist integer
);


--
-- Name: artist_instruments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.artist_instruments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: artist_instruments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.artist_instruments_id_seq OWNED BY public.artist_instruments.id;


--
-- Name: artist_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.artist_media (
    id integer NOT NULL,
    id_media integer,
    title text,
    image text,
    description text,
    url text,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_update timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    id_artist integer,
    created_by uuid,
    updated_by uuid
);


--
-- Name: artist_media_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.artist_media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: artist_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.artist_media_id_seq OWNED BY public.artist_media.id;


--
-- Name: artist_performance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.artist_performance (
    id integer NOT NULL,
    id_artist integer,
    id_performance integer,
    created_by uuid,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_update timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by uuid
);


--
-- Name: artist_performance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.artist_performance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: artist_performance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.artist_performance_id_seq OWNED BY public.artist_performance.id;


--
-- Name: artist_request; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.artist_request (
    id integer NOT NULL,
    id_artist integer,
    id_req_type integer,
    title text,
    short_desc text,
    long_desc text,
    id_host integer,
    status integer DEFAULT 1,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    comment text,
    last_update timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by uuid,
    instrument text[],
    propose_date text[]
);


--
-- Name: artist_request_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.artist_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: artist_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.artist_request_id_seq OWNED BY public.artist_request.id;


--
-- Name: artist_request_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.artist_request_media (
    id integer NOT NULL,
    id_media_type integer,
    id_request integer,
    title text,
    image text,
    description text,
    created_by uuid,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_update timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by uuid,
    id_auth uuid,
    url text
);


--
-- Name: artist_request_media_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.artist_request_media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: artist_request_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.artist_request_media_id_seq OWNED BY public.artist_request_media.id;


--
-- Name: artist_requirement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.artist_requirement (
    id integer NOT NULL,
    id_artist integer NOT NULL,
    rib text,
    guso_nb text,
    security_nb text,
    arlergies text,
    food_restriction text,
    requirement text,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    last_updated timestamp without time zone,
    updated_by uuid,
    conge_spectacle text
);


--
-- Name: artist_requirement_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.artist_requirement_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: artist_requirement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.artist_requirement_id_seq OWNED BY public.artist_requirement.id;


--
-- Name: artists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.artists (
    id integer NOT NULL,
    id_profile uuid,
    fname text,
    lname text,
    title text,
    teaser text,
    short_bio text,
    long_bio text,
    dob date,
    pob text,
    email text,
    phone text,
    website text,
    address text,
    city text,
    country text,
    gender text,
    photo text,
    credit_photo text,
    is_featured boolean DEFAULT false,
    is_active boolean DEFAULT false,
    cover text,
    credit_cover text,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    updated_by uuid,
    last_update timestamp without time zone
);


--
-- Name: artists_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.artists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: artists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.artists_id_seq OWNED BY public.artists.id;


--
-- Name: event_artists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_artists (
    id integer NOT NULL,
    id_event integer,
    id_artist integer,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    updated_by uuid,
    last_update timestamp without time zone
);


--
-- Name: event_artists_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.event_artists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: event_artists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.event_artists_id_seq OWNED BY public.event_artists.id;


--
-- Name: event_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_comments (
    id integer NOT NULL,
    id_event integer,
    id_host integer,
    id_artist integer,
    comment text,
    who integer,
    dated timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: event_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.event_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: event_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.event_comments_id_seq OWNED BY public.event_comments.id;


--
-- Name: event_dates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_dates (
    id integer NOT NULL,
    id_event integer,
    id_location integer,
    flag text,
    start_date date,
    end_date date,
    "time" time without time zone,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    last_update timestamp without time zone,
    updated_by uuid
);


--
-- Name: event_dates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.event_dates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: event_dates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.event_dates_id_seq OWNED BY public.event_dates.id;


--
-- Name: event_edition; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_edition (
    id integer NOT NULL,
    name text,
    year text,
    id_edition_type integer,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    last_update timestamp without time zone,
    update_by uuid
);


--
-- Name: event_edition_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.event_edition_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: event_edition_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.event_edition_id_seq OWNED BY public.event_edition.id;


--
-- Name: event_instruments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_instruments (
    id integer NOT NULL,
    id_instrument integer,
    id_event integer,
    id_artist integer,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    updated_by uuid,
    last_update timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: event_instruments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.event_instruments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: event_instruments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.event_instruments_id_seq OWNED BY public.event_instruments.id;


--
-- Name: event_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_media (
    id integer NOT NULL,
    id_media_type integer,
    id_event integer,
    title text,
    image text,
    description text,
    url text,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    updated_by uuid,
    last_update timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: event_media_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.event_media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: event_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.event_media_id_seq OWNED BY public.event_media.id;


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id integer NOT NULL,
    title text,
    id_edition integer,
    id_event_domain integer,
    id_event_type integer,
    teaser text,
    long_teaser text,
    id_host integer,
    description text,
    booking_url text,
    photo text,
    credit_photo text,
    is_active boolean DEFAULT false,
    created_by uuid,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_update timestamp without time zone,
    updated_by uuid,
    status integer DEFAULT 0,
    comments text
);


--
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


--
-- Name: host_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.host_users (
    id integer NOT NULL,
    id_profile uuid,
    id_host integer
);


--
-- Name: host_users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.host_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: host_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.host_users_id_seq OWNED BY public.host_users.id;


--
-- Name: hosts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hosts (
    id integer NOT NULL,
    name text,
    address text,
    city text,
    proviance text,
    zip text,
    country text,
    host_per_year text,
    public_name text,
    capacity integer,
    id_host_type integer,
    contact_fname text,
    contact_lname text,
    contact_phone1 text,
    contact_phone2 text,
    contact_email text,
    comment text,
    web_url text,
    photo text,
    photo_credit text,
    created_by uuid,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_update timestamp without time zone,
    updated_by uuid
);


--
-- Name: hosts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hosts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hosts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hosts_id_seq OWNED BY public.hosts.id;


--
-- Name: location_amenity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.location_amenity (
    id integer NOT NULL,
    id_location integer,
    id_amenity integer,
    created_by uuid,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_update timestamp without time zone,
    updated_by uuid
);


--
-- Name: location_amenity_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.location_amenity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: location_amenity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.location_amenity_id_seq OWNED BY public.location_amenity.id;


--
-- Name: location_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.location_images (
    id integer NOT NULL,
    id_location integer,
    url text,
    created_by uuid,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_update timestamp without time zone,
    updated_by uuid,
    credit text
);


--
-- Name: location_images_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.location_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: location_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.location_images_id_seq OWNED BY public.location_images.id;


--
-- Name: location_specs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.location_specs (
    id integer NOT NULL,
    id_location integer,
    id_specs integer,
    created_by uuid,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_update timestamp without time zone,
    updated_by uuid
);


--
-- Name: location_specs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.location_specs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: location_specs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.location_specs_id_seq OWNED BY public.location_specs.id;


--
-- Name: location_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.location_types (
    id integer NOT NULL,
    id_location integer,
    id_location_type integer,
    created_by uuid,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_update timestamp without time zone,
    updated_by uuid
);


--
-- Name: location_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.location_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: location_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.location_types_id_seq OWNED BY public.location_types.id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.locations (
    id integer NOT NULL,
    id_host integer,
    name text,
    address text,
    lat text,
    long text,
    description text,
    public text,
    public_description text,
    restricted_description text,
    capacity text,
    city text,
    country text,
    zip text,
    phone text,
    email text,
    website text,
    is_active boolean,
    created_by uuid,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_update timestamp without time zone,
    updated_by uuid,
    access_info text
);


--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;


--
-- Name: newsletter; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.newsletter (
    id integer NOT NULL,
    name text,
    phone text,
    email text,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: newsletter_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.newsletter_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: newsletter_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.newsletter_id_seq OWNED BY public.newsletter.id;


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    username text,
    display_name text,
    public_profile boolean DEFAULT true
);


--
-- Name: sys_artist_performance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_artist_performance (
    id integer NOT NULL,
    name text,
    last_update timestamp without time zone,
    update_by uuid
);


--
-- Name: sys_artist_performance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_artist_performance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_artist_performance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_artist_performance_id_seq OWNED BY public.sys_artist_performance.id;


--
-- Name: sys_event_domain; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_event_domain (
    id integer NOT NULL,
    name text,
    last_update timestamp without time zone,
    update_by uuid
);


--
-- Name: sys_event_domain_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_event_domain_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_event_domain_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_event_domain_id_seq OWNED BY public.sys_event_domain.id;


--
-- Name: sys_event_edition; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_event_edition (
    id integer NOT NULL,
    name text,
    last_update timestamp without time zone,
    update_by uuid
);


--
-- Name: sys_event_edition_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_event_edition_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_event_edition_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_event_edition_id_seq OWNED BY public.sys_event_edition.id;


--
-- Name: sys_event_type; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_event_type (
    id integer NOT NULL,
    name text,
    last_update timestamp without time zone,
    update_by uuid
);


--
-- Name: sys_event_type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_event_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_event_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_event_type_id_seq OWNED BY public.sys_event_type.id;


--
-- Name: sys_host_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_host_types (
    id integer NOT NULL,
    name text,
    last_update timestamp without time zone,
    update_by uuid
);


--
-- Name: sys_host_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_host_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_host_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_host_types_id_seq OWNED BY public.sys_host_types.id;


--
-- Name: sys_instruments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_instruments (
    id integer NOT NULL,
    name text NOT NULL,
    color text
);


--
-- Name: sys_instruments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_instruments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_instruments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_instruments_id_seq OWNED BY public.sys_instruments.id;


--
-- Name: sys_location_amenity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_location_amenity (
    id integer NOT NULL,
    name text,
    created_by uuid,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_update timestamp without time zone,
    updated_by uuid
);


--
-- Name: sys_location_amenity_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_location_amenity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_location_amenity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_location_amenity_id_seq OWNED BY public.sys_location_amenity.id;


--
-- Name: sys_location_specs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_location_specs (
    id integer NOT NULL,
    name text,
    created_by uuid,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_update timestamp without time zone,
    updated_by uuid
);


--
-- Name: sys_location_specs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_location_specs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_location_specs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_location_specs_id_seq OWNED BY public.sys_location_specs.id;


--
-- Name: sys_location_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_location_types (
    id integer NOT NULL,
    name text,
    created_by uuid,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_update timestamp without time zone,
    updated_by uuid
);


--
-- Name: sys_location_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_location_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_location_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_location_types_id_seq OWNED BY public.sys_location_types.id;


--
-- Name: sys_media_type; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_media_type (
    id integer NOT NULL,
    name text
);


--
-- Name: sys_media_type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_media_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_media_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_media_type_id_seq OWNED BY public.sys_media_type.id;


--
-- Name: sys_request_type; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sys_request_type (
    id integer NOT NULL,
    name text,
    created_by uuid,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_update timestamp without time zone,
    updated_by uuid
);


--
-- Name: sys_request_type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sys_request_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sys_request_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sys_request_type_id_seq OWNED BY public.sys_request_type.id;


--
-- Name: tjs_artists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tjs_artists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid,
    artist_name text NOT NULL,
    is_tjs_artist boolean DEFAULT false,
    is_invited_artist boolean DEFAULT false,
    pag_artist_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: tjs_host_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tjs_host_members (
    id integer NOT NULL,
    host_id integer NOT NULL,
    profile_id uuid NOT NULL,
    role text DEFAULT 'member'::text,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: tjs_host_members_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tjs_host_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tjs_host_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tjs_host_members_id_seq OWNED BY public.tjs_host_members.id;


--
-- Name: tjs_hosts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tjs_hosts (
    id integer NOT NULL,
    name text,
    address text,
    city text,
    proviance text,
    zip text,
    country text,
    host_per_year text,
    public_name text,
    capacity integer,
    id_host_type integer,
    contact_fname text,
    contact_lname text,
    contact_phone1 text,
    contact_phone2 text,
    contact_email text,
    comment text,
    web_url text,
    photo text,
    photo_credit text,
    created_by uuid,
    created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_update timestamp without time zone,
    updated_by uuid,
    is_host_plus boolean DEFAULT false
);


--
-- Name: tjs_hosts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tjs_hosts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tjs_hosts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tjs_hosts_id_seq OWNED BY public.tjs_hosts.id;


--
-- Name: tjs_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tjs_messages (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    prenom text,
    nom text,
    email text,
    message text
);


--
-- Name: tjs_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.tjs_messages ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.tjs_messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tjs_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tjs_profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    phone text,
    bio text,
    avatar_url text,
    member_since date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: tjs_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tjs_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    permissions jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: tjs_user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tjs_user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    role_id uuid,
    is_active boolean DEFAULT true,
    assigned_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_profile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profile (
    id integer NOT NULL,
    id_user uuid,
    id_role integer,
    first_name text,
    last_name text,
    email text,
    phone text,
    city text,
    proviance text,
    country text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    created_by uuid,
    last_update timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_by uuid,
    id_active boolean DEFAULT true,
    status integer
);


--
-- Name: user_profile_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_profile_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_profile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_profile_id_seq OWNED BY public.user_profile.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id integer NOT NULL,
    name text
);


--
-- Name: user_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_roles_id_seq OWNED BY public.user_roles.id;


--
-- Name: visitor_message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visitor_message (
    id integer NOT NULL,
    fname text,
    lname text,
    email text,
    msg text
);


--
-- Name: visitor_message_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.visitor_message_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: visitor_message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.visitor_message_id_seq OWNED BY public.visitor_message.id;


--
-- Name: vw_artist_instruments; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_artist_instruments AS
 SELECT a.id AS id_inst,
    a.id_instrument,
    a.id_artist,
    sit.name AS instrument,
    sit.color AS inst_color
   FROM (public.artist_instruments a
     JOIN public.sys_instruments sit ON ((a.id_instrument = sit.id)));


--
-- Name: vw_artist_performance; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_artist_performance AS
 SELECT ap.id AS id_ap,
    ap.id_artist,
    ap.id_performance,
    spt.name AS performance_type
   FROM (public.artist_performance ap
     JOIN public.sys_artist_performance spt ON ((spt.id = ap.id_performance)));


--
-- Name: vw_available_artists; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_available_artists AS
 SELECT id,
    id AS id_artist,
    id AS artist_id,
    id_profile,
    fname,
    lname,
    fname AS first_name,
    lname AS last_name,
    title,
    teaser,
    short_bio,
    long_bio,
    dob,
    pob,
    email,
    phone,
    website,
    address,
    city,
    country,
    gender,
    photo,
    photo AS image,
    credit_photo,
    is_featured,
    is_active,
    cover,
    credit_cover,
    created_on,
    created_by,
    updated_by,
    last_update
   FROM public.artists a
  WHERE ((is_active = true) AND (fname IS NOT NULL) AND (lname IS NOT NULL))
  ORDER BY fname, lname;


--
-- Name: vw_dashboard_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_dashboard_stats AS
 SELECT ( SELECT count(DISTINCT event_dates.id_event) AS count
           FROM public.event_dates
          WHERE (event_dates.start_date > CURRENT_DATE)) AS upcoming_events,
    ( SELECT count(DISTINCT event_dates.id_event) AS count
           FROM public.event_dates
          WHERE ((event_dates.start_date >= date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone)) AND (event_dates.start_date < (date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone) + '1 mon'::interval)))) AS events_this_month,
    ( SELECT count(*) AS count
           FROM public.artists
          WHERE (artists.is_active = true)) AS artist_count,
    ( SELECT count(*) AS count
           FROM public.locations) AS location_count,
    ( SELECT count(*) AS count
           FROM public.events
          WHERE (events.status = 2)) AS artist_requests_pending;


--
-- Name: vw_get_all_artists; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_get_all_artists AS
SELECT
    NULL::integer AS artist_id,
    NULL::text AS artist_name,
    NULL::text AS phone,
    NULL::text AS photo,
    NULL::boolean AS is_featured,
    NULL::bigint AS upcoming_events,
    NULL::bigint AS total_events,
    NULL::boolean AS status,
    NULL::timestamp without time zone AS created_on;


--
-- Name: vw_get_artist_instruments; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_get_artist_instruments AS
 SELECT ai.id,
    ai.id_artist,
    ai.id_instrument,
    a.fname,
    a.lname,
    a.fname AS first_name,
    a.lname AS last_name,
    a.photo,
    a.email,
    a.is_active,
    si.name
   FROM ((public.artist_instruments ai
     LEFT JOIN public.artists a ON ((ai.id_artist = a.id)))
     LEFT JOIN public.sys_instruments si ON ((ai.id_instrument = si.id)))
  WHERE (a.is_active = true)
  ORDER BY a.fname, a.lname, si.name;


--
-- Name: vw_get_artists_request; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_get_artists_request AS
SELECT
    NULL::integer AS id,
    NULL::text AS title,
    NULL::integer AS id_event_domain,
    NULL::text AS domain,
    NULL::timestamp without time zone AS created_on,
    NULL::uuid AS created_by,
    NULL::date AS min,
    NULL::text AS fname,
    NULL::text AS lname,
    NULL::integer AS status;


--
-- Name: vw_user_profile_role; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_user_profile_role AS
 SELECT up.id,
    up.id_user,
    up.id_role,
    up.first_name,
    up.last_name,
    up.email,
    up.phone,
    up.city,
    up.proviance,
    up.country,
    up.created_at,
    up.created_by,
    up.last_update,
    up.updated_by,
    ur.name AS rolename
   FROM (public.user_profile up
     JOIN public.user_roles ur ON ((up.id_role = ur.id)));


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: artist_availability id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_availability ALTER COLUMN id SET DEFAULT nextval('public.artist_availability_id_seq'::regclass);


--
-- Name: artist_awards id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_awards ALTER COLUMN id SET DEFAULT nextval('public.artist_awards_id_seq'::regclass);


--
-- Name: artist_education id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_education ALTER COLUMN id SET DEFAULT nextval('public.artist_education_id_seq'::regclass);


--
-- Name: artist_instruments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_instruments ALTER COLUMN id SET DEFAULT nextval('public.artist_instruments_id_seq'::regclass);


--
-- Name: artist_media id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_media ALTER COLUMN id SET DEFAULT nextval('public.artist_media_id_seq'::regclass);


--
-- Name: artist_performance id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_performance ALTER COLUMN id SET DEFAULT nextval('public.artist_performance_id_seq'::regclass);


--
-- Name: artist_request id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_request ALTER COLUMN id SET DEFAULT nextval('public.artist_request_id_seq'::regclass);


--
-- Name: artist_request_media id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_request_media ALTER COLUMN id SET DEFAULT nextval('public.artist_request_media_id_seq'::regclass);


--
-- Name: artist_requirement id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_requirement ALTER COLUMN id SET DEFAULT nextval('public.artist_requirement_id_seq'::regclass);


--
-- Name: artists id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artists ALTER COLUMN id SET DEFAULT nextval('public.artists_id_seq'::regclass);


--
-- Name: event_artists id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_artists ALTER COLUMN id SET DEFAULT nextval('public.event_artists_id_seq'::regclass);


--
-- Name: event_comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_comments ALTER COLUMN id SET DEFAULT nextval('public.event_comments_id_seq'::regclass);


--
-- Name: event_dates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_dates ALTER COLUMN id SET DEFAULT nextval('public.event_dates_id_seq'::regclass);


--
-- Name: event_edition id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_edition ALTER COLUMN id SET DEFAULT nextval('public.event_edition_id_seq'::regclass);


--
-- Name: event_instruments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_instruments ALTER COLUMN id SET DEFAULT nextval('public.event_instruments_id_seq'::regclass);


--
-- Name: event_media id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_media ALTER COLUMN id SET DEFAULT nextval('public.event_media_id_seq'::regclass);


--
-- Name: events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- Name: host_users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.host_users ALTER COLUMN id SET DEFAULT nextval('public.host_users_id_seq'::regclass);


--
-- Name: hosts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hosts ALTER COLUMN id SET DEFAULT nextval('public.hosts_id_seq'::regclass);


--
-- Name: location_amenity id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_amenity ALTER COLUMN id SET DEFAULT nextval('public.location_amenity_id_seq'::regclass);


--
-- Name: location_images id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_images ALTER COLUMN id SET DEFAULT nextval('public.location_images_id_seq'::regclass);


--
-- Name: location_specs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_specs ALTER COLUMN id SET DEFAULT nextval('public.location_specs_id_seq'::regclass);


--
-- Name: location_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_types ALTER COLUMN id SET DEFAULT nextval('public.location_types_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- Name: newsletter id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter ALTER COLUMN id SET DEFAULT nextval('public.newsletter_id_seq'::regclass);


--
-- Name: sys_artist_performance id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_artist_performance ALTER COLUMN id SET DEFAULT nextval('public.sys_artist_performance_id_seq'::regclass);


--
-- Name: sys_event_domain id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_event_domain ALTER COLUMN id SET DEFAULT nextval('public.sys_event_domain_id_seq'::regclass);


--
-- Name: sys_event_edition id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_event_edition ALTER COLUMN id SET DEFAULT nextval('public.sys_event_edition_id_seq'::regclass);


--
-- Name: sys_event_type id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_event_type ALTER COLUMN id SET DEFAULT nextval('public.sys_event_type_id_seq'::regclass);


--
-- Name: sys_host_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_host_types ALTER COLUMN id SET DEFAULT nextval('public.sys_host_types_id_seq'::regclass);


--
-- Name: sys_instruments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_instruments ALTER COLUMN id SET DEFAULT nextval('public.sys_instruments_id_seq'::regclass);


--
-- Name: sys_location_amenity id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_location_amenity ALTER COLUMN id SET DEFAULT nextval('public.sys_location_amenity_id_seq'::regclass);


--
-- Name: sys_location_specs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_location_specs ALTER COLUMN id SET DEFAULT nextval('public.sys_location_specs_id_seq'::regclass);


--
-- Name: sys_location_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_location_types ALTER COLUMN id SET DEFAULT nextval('public.sys_location_types_id_seq'::regclass);


--
-- Name: sys_media_type id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_media_type ALTER COLUMN id SET DEFAULT nextval('public.sys_media_type_id_seq'::regclass);


--
-- Name: sys_request_type id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_request_type ALTER COLUMN id SET DEFAULT nextval('public.sys_request_type_id_seq'::regclass);


--
-- Name: tjs_host_members id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tjs_host_members ALTER COLUMN id SET DEFAULT nextval('public.tjs_host_members_id_seq'::regclass);


--
-- Name: tjs_hosts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tjs_hosts ALTER COLUMN id SET DEFAULT nextval('public.tjs_hosts_id_seq'::regclass);


--
-- Name: user_profile id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profile ALTER COLUMN id SET DEFAULT nextval('public.user_profile_id_seq'::regclass);


--
-- Name: user_roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles ALTER COLUMN id SET DEFAULT nextval('public.user_roles_id_seq'::regclass);


--
-- Name: visitor_message id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitor_message ALTER COLUMN id SET DEFAULT nextval('public.visitor_message_id_seq'::regclass);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webauthn_challenges webauthn_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_pkey PRIMARY KEY (id);


--
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- Name: artist_availability artist_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_availability
    ADD CONSTRAINT artist_availability_pkey PRIMARY KEY (id);


--
-- Name: artist_awards artist_awards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_awards
    ADD CONSTRAINT artist_awards_pkey PRIMARY KEY (id);


--
-- Name: artist_education artist_education_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_education
    ADD CONSTRAINT artist_education_pkey PRIMARY KEY (id);


--
-- Name: artist_instruments artist_instruments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_instruments
    ADD CONSTRAINT artist_instruments_pkey PRIMARY KEY (id);


--
-- Name: artist_request_media artist_request_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_request_media
    ADD CONSTRAINT artist_request_media_pkey PRIMARY KEY (id);


--
-- Name: artist_request artist_request_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_request
    ADD CONSTRAINT artist_request_pkey PRIMARY KEY (id);


--
-- Name: artist_requirement artist_requirement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_requirement
    ADD CONSTRAINT artist_requirement_pkey PRIMARY KEY (id);


--
-- Name: artists artists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artists
    ADD CONSTRAINT artists_pkey PRIMARY KEY (id);


--
-- Name: event_dates event_dates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_dates
    ADD CONSTRAINT event_dates_pkey PRIMARY KEY (id);


--
-- Name: event_edition event_edition_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_edition
    ADD CONSTRAINT event_edition_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: hosts hosts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hosts
    ADD CONSTRAINT hosts_pkey PRIMARY KEY (id);


--
-- Name: location_images location_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_images
    ADD CONSTRAINT location_images_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: newsletter newsletter_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter
    ADD CONSTRAINT newsletter_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: sys_artist_performance sys_artist_performance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_artist_performance
    ADD CONSTRAINT sys_artist_performance_pkey PRIMARY KEY (id);


--
-- Name: sys_event_domain sys_event_domain_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_event_domain
    ADD CONSTRAINT sys_event_domain_pkey PRIMARY KEY (id);


--
-- Name: sys_event_edition sys_event_edition_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_event_edition
    ADD CONSTRAINT sys_event_edition_pkey PRIMARY KEY (id);


--
-- Name: sys_event_type sys_event_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_event_type
    ADD CONSTRAINT sys_event_type_pkey PRIMARY KEY (id);


--
-- Name: sys_host_types sys_host_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_host_types
    ADD CONSTRAINT sys_host_types_pkey PRIMARY KEY (id);


--
-- Name: sys_instruments sys_instruments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_instruments
    ADD CONSTRAINT sys_instruments_pkey PRIMARY KEY (id);


--
-- Name: sys_location_amenity sys_location_amenity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_location_amenity
    ADD CONSTRAINT sys_location_amenity_pkey PRIMARY KEY (id);


--
-- Name: sys_location_specs sys_location_specs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_location_specs
    ADD CONSTRAINT sys_location_specs_pkey PRIMARY KEY (id);


--
-- Name: sys_location_types sys_location_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_location_types
    ADD CONSTRAINT sys_location_types_pkey PRIMARY KEY (id);


--
-- Name: sys_media_type sys_media_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_media_type
    ADD CONSTRAINT sys_media_type_pkey PRIMARY KEY (id);


--
-- Name: sys_request_type sys_request_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_request_type
    ADD CONSTRAINT sys_request_type_pkey PRIMARY KEY (id);


--
-- Name: tjs_artists tjs_artists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tjs_artists
    ADD CONSTRAINT tjs_artists_pkey PRIMARY KEY (id);


--
-- Name: tjs_artists tjs_artists_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tjs_artists
    ADD CONSTRAINT tjs_artists_profile_id_key UNIQUE (profile_id);


--
-- Name: tjs_host_members tjs_host_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tjs_host_members
    ADD CONSTRAINT tjs_host_members_pkey PRIMARY KEY (id);


--
-- Name: tjs_host_members tjs_host_members_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tjs_host_members
    ADD CONSTRAINT tjs_host_members_unique UNIQUE (host_id, profile_id);


--
-- Name: tjs_hosts tjs_hosts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tjs_hosts
    ADD CONSTRAINT tjs_hosts_pkey PRIMARY KEY (id);


--
-- Name: tjs_messages tjs_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tjs_messages
    ADD CONSTRAINT tjs_messages_pkey PRIMARY KEY (id);


--
-- Name: tjs_profiles tjs_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tjs_profiles
    ADD CONSTRAINT tjs_profiles_pkey PRIMARY KEY (id);


--
-- Name: tjs_roles tjs_roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tjs_roles
    ADD CONSTRAINT tjs_roles_name_key UNIQUE (name);


--
-- Name: tjs_roles tjs_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tjs_roles
    ADD CONSTRAINT tjs_roles_pkey PRIMARY KEY (id);


--
-- Name: tjs_user_roles tjs_user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tjs_user_roles
    ADD CONSTRAINT tjs_user_roles_pkey PRIMARY KEY (id);


--
-- Name: tjs_user_roles tjs_user_roles_user_id_role_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tjs_user_roles
    ADD CONSTRAINT tjs_user_roles_user_id_role_id_key UNIQUE (user_id, role_id);


--
-- Name: user_profile user_profile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profile
    ADD CONSTRAINT user_profile_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: visitor_message visitor_message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitor_message
    ADD CONSTRAINT visitor_message_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: webauthn_challenges_expires_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at);


--
-- Name: webauthn_challenges_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id);


--
-- Name: webauthn_credentials_credential_id_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id);


--
-- Name: webauthn_credentials_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id);


--
-- Name: idx_tjs_host_members_host; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tjs_host_members_host ON public.tjs_host_members USING btree (host_id);


--
-- Name: idx_tjs_host_members_profile; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tjs_host_members_profile ON public.tjs_host_members USING btree (profile_id);


--
-- Name: idx_tjs_user_roles_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tjs_user_roles_role ON public.tjs_user_roles USING btree (role_id);


--
-- Name: idx_tjs_user_roles_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tjs_user_roles_user ON public.tjs_user_roles USING btree (user_id);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_key; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_key ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter);


--
-- Name: vw_get_all_artists _RETURN; Type: RULE; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.vw_get_all_artists AS
 SELECT a.id AS artist_id,
    TRIM(BOTH FROM concat(a.fname, ' ', a.lname)) AS artist_name,
    a.phone,
    a.photo,
    a.is_featured,
    count(
        CASE
            WHEN ((ed.start_date >= CURRENT_DATE) OR ((ed.start_date = CURRENT_DATE) AND ((ed."time")::time with time zone > CURRENT_TIME))) THEN 1
            ELSE NULL::integer
        END) AS upcoming_events,
    count(ea.id_event) AS total_events,
    a.is_active AS status,
    a.created_on
   FROM ((public.artists a
     LEFT JOIN public.event_artists ea ON ((a.id = ea.id_artist)))
     LEFT JOIN public.event_dates ed ON ((ea.id_event = ed.id_event)))
  GROUP BY a.id, a.fname, a.lname, a.phone, a.is_featured, a.is_active, a.created_on;


--
-- Name: vw_get_artists_request _RETURN; Type: RULE; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.vw_get_artists_request AS
 SELECT a.id,
    a.title,
    a.id_event_domain,
    b.name AS domain,
    a.created_on,
    a.created_by,
    min(c.start_date) AS min,
    d.fname,
    d.lname,
    a.status
   FROM (((public.events a
     JOIN public.sys_event_domain b ON ((a.id_event_domain = b.id)))
     JOIN public.event_dates c ON ((a.id = c.id_event)))
     JOIN public.artists d ON ((a.created_by = d.id_profile)))
  WHERE (a.status = ANY (ARRAY[2, 3, 4, 5]))
  GROUP BY a.id, a.title, a.id_event_domain, b.name, a.created_on, a.created_by, d.fname, d.lname;


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: webauthn_challenges webauthn_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: webauthn_credentials webauthn_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: artist_availability artist_availability_id_artist_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_availability
    ADD CONSTRAINT artist_availability_id_artist_fkey FOREIGN KEY (id_artist) REFERENCES public.artists(id);


--
-- Name: artist_awards artist_awards_id_artist_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_awards
    ADD CONSTRAINT artist_awards_id_artist_fkey FOREIGN KEY (id_artist) REFERENCES public.artists(id);


--
-- Name: artist_education artist_education_id_artist_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_education
    ADD CONSTRAINT artist_education_id_artist_fkey FOREIGN KEY (id_artist) REFERENCES public.artists(id);


--
-- Name: artist_instruments artist_instruments_id_artist_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_instruments
    ADD CONSTRAINT artist_instruments_id_artist_fkey FOREIGN KEY (id_artist) REFERENCES public.artists(id);


--
-- Name: artist_request artist_request_id_artist_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_request
    ADD CONSTRAINT artist_request_id_artist_fkey FOREIGN KEY (id_artist) REFERENCES public.artists(id);


--
-- Name: artist_request artist_request_id_host_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_request
    ADD CONSTRAINT artist_request_id_host_fkey FOREIGN KEY (id_host) REFERENCES public.hosts(id);


--
-- Name: artist_request artist_request_id_req_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_request
    ADD CONSTRAINT artist_request_id_req_type_fkey FOREIGN KEY (id_req_type) REFERENCES public.sys_request_type(id);


--
-- Name: artist_request_media artist_request_media_id_media_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_request_media
    ADD CONSTRAINT artist_request_media_id_media_type_fkey FOREIGN KEY (id_media_type) REFERENCES public.sys_media_type(id);


--
-- Name: artist_request_media artist_request_media_id_request_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_request_media
    ADD CONSTRAINT artist_request_media_id_request_fkey FOREIGN KEY (id_request) REFERENCES public.artist_request(id);


--
-- Name: event_artists event_artists_id_artist_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_artists
    ADD CONSTRAINT event_artists_id_artist_fkey FOREIGN KEY (id_artist) REFERENCES public.artists(id);


--
-- Name: event_artists event_artists_id_event_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_artists
    ADD CONSTRAINT event_artists_id_event_fkey FOREIGN KEY (id_event) REFERENCES public.events(id);


--
-- Name: event_dates event_dates_id_event_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_dates
    ADD CONSTRAINT event_dates_id_event_fkey FOREIGN KEY (id_event) REFERENCES public.events(id);


--
-- Name: event_dates event_dates_id_location_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_dates
    ADD CONSTRAINT event_dates_id_location_fkey FOREIGN KEY (id_location) REFERENCES public.locations(id);


--
-- Name: event_edition event_edition_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_edition
    ADD CONSTRAINT event_edition_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: event_edition event_edition_id_edition_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_edition
    ADD CONSTRAINT event_edition_id_edition_type_fkey FOREIGN KEY (id_edition_type) REFERENCES public.sys_event_edition(id);


--
-- Name: event_edition event_edition_update_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_edition
    ADD CONSTRAINT event_edition_update_by_fkey FOREIGN KEY (update_by) REFERENCES auth.users(id);


--
-- Name: event_instruments event_instruments_id_artist_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_instruments
    ADD CONSTRAINT event_instruments_id_artist_fkey FOREIGN KEY (id_artist) REFERENCES public.artists(id);


--
-- Name: event_instruments event_instruments_id_event_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_instruments
    ADD CONSTRAINT event_instruments_id_event_fkey FOREIGN KEY (id_event) REFERENCES public.events(id);


--
-- Name: event_instruments event_instruments_id_instrument_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_instruments
    ADD CONSTRAINT event_instruments_id_instrument_fkey FOREIGN KEY (id_instrument) REFERENCES public.sys_instruments(id);


--
-- Name: event_media event_media_id_event_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_media
    ADD CONSTRAINT event_media_id_event_fkey FOREIGN KEY (id_event) REFERENCES public.events(id);


--
-- Name: event_media event_media_id_media_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_media
    ADD CONSTRAINT event_media_id_media_type_fkey FOREIGN KEY (id_media_type) REFERENCES public.sys_media_type(id);


--
-- Name: events events_id_edition_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_id_edition_fkey FOREIGN KEY (id_edition) REFERENCES public.event_edition(id);


--
-- Name: events events_id_event_domain_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_id_event_domain_fkey FOREIGN KEY (id_event_domain) REFERENCES public.sys_event_domain(id);


--
-- Name: events events_id_event_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_id_event_type_fkey FOREIGN KEY (id_event_type) REFERENCES public.sys_event_type(id);


--
-- Name: events events_id_host_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_id_host_fkey FOREIGN KEY (id_host) REFERENCES public.hosts(id);


--
-- Name: hosts hosts_id_host_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hosts
    ADD CONSTRAINT hosts_id_host_type_fkey FOREIGN KEY (id_host_type) REFERENCES public.sys_host_types(id);


--
-- Name: location_amenity location_amenity_id_amenity_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_amenity
    ADD CONSTRAINT location_amenity_id_amenity_fkey FOREIGN KEY (id_amenity) REFERENCES public.sys_location_amenity(id);


--
-- Name: location_amenity location_amenity_id_location_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_amenity
    ADD CONSTRAINT location_amenity_id_location_fkey FOREIGN KEY (id_location) REFERENCES public.locations(id);


--
-- Name: location_images location_images_id_location_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_images
    ADD CONSTRAINT location_images_id_location_fkey FOREIGN KEY (id_location) REFERENCES public.locations(id);


--
-- Name: location_specs location_specs_id_location_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_specs
    ADD CONSTRAINT location_specs_id_location_fkey FOREIGN KEY (id_location) REFERENCES public.locations(id);


--
-- Name: location_specs location_specs_id_specs_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_specs
    ADD CONSTRAINT location_specs_id_specs_fkey FOREIGN KEY (id_specs) REFERENCES public.sys_location_specs(id);


--
-- Name: location_types location_types_id_location_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_types
    ADD CONSTRAINT location_types_id_location_fkey FOREIGN KEY (id_location) REFERENCES public.locations(id);


--
-- Name: location_types location_types_id_location_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_types
    ADD CONSTRAINT location_types_id_location_type_fkey FOREIGN KEY (id_location_type) REFERENCES public.sys_location_types(id);


--
-- Name: locations locations_id_host_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_id_host_fkey FOREIGN KEY (id_host) REFERENCES public.hosts(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sys_event_domain sys_event_domain_update_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_event_domain
    ADD CONSTRAINT sys_event_domain_update_by_fkey FOREIGN KEY (update_by) REFERENCES auth.users(id);


--
-- Name: sys_event_edition sys_event_edition_update_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_event_edition
    ADD CONSTRAINT sys_event_edition_update_by_fkey FOREIGN KEY (update_by) REFERENCES auth.users(id);


--
-- Name: sys_event_type sys_event_type_update_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_event_type
    ADD CONSTRAINT sys_event_type_update_by_fkey FOREIGN KEY (update_by) REFERENCES auth.users(id);


--
-- Name: sys_host_types sys_host_types_update_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sys_host_types
    ADD CONSTRAINT sys_host_types_update_by_fkey FOREIGN KEY (update_by) REFERENCES auth.users(id);


--
-- Name: tjs_artists tjs_artists_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tjs_artists
    ADD CONSTRAINT tjs_artists_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.tjs_profiles(id) ON DELETE CASCADE;


--
-- Name: tjs_host_members tjs_host_members_host_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tjs_host_members
    ADD CONSTRAINT tjs_host_members_host_id_fkey FOREIGN KEY (host_id) REFERENCES public.tjs_hosts(id) ON DELETE CASCADE;


--
-- Name: tjs_host_members tjs_host_members_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tjs_host_members
    ADD CONSTRAINT tjs_host_members_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.tjs_profiles(id) ON DELETE CASCADE;


--
-- Name: tjs_profiles tjs_profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tjs_profiles
    ADD CONSTRAINT tjs_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tjs_user_roles tjs_user_roles_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tjs_user_roles
    ADD CONSTRAINT tjs_user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id);


--
-- Name: tjs_user_roles tjs_user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tjs_user_roles
    ADD CONSTRAINT tjs_user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.tjs_roles(id) ON DELETE CASCADE;


--
-- Name: tjs_user_roles tjs_user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tjs_user_roles
    ADD CONSTRAINT tjs_user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_profile user_profile_id_role_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profile
    ADD CONSTRAINT user_profile_id_role_fkey FOREIGN KEY (id_role) REFERENCES public.user_roles(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: tjs_artists Admin and Committee create artists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Committee create artists" ON public.tjs_artists FOR INSERT WITH CHECK ((public.tjs_is_admin(auth.uid()) OR public.tjs_has_role(auth.uid(), 'Committee Member'::text)));


--
-- Name: tjs_user_roles Admins and Committee assign roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and Committee assign roles" ON public.tjs_user_roles FOR INSERT WITH CHECK ((public.tjs_is_admin(auth.uid()) OR public.tjs_has_role(auth.uid(), 'Committee Member'::text)));


--
-- Name: tjs_host_members Admins can do everything on host_members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can do everything on host_members" ON public.tjs_host_members USING (public.tjs_is_admin(auth.uid()));


--
-- Name: tjs_user_roles Admins delete roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins delete roles" ON public.tjs_user_roles FOR DELETE USING (public.tjs_is_admin(auth.uid()));


--
-- Name: tjs_user_roles Admins update roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins update roles" ON public.tjs_user_roles FOR UPDATE USING (public.tjs_is_admin(auth.uid()));


--
-- Name: tjs_profiles Admins view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins view all profiles" ON public.tjs_profiles FOR SELECT USING (public.tjs_is_admin(auth.uid()));


--
-- Name: tjs_user_roles Admins view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins view all roles" ON public.tjs_user_roles FOR SELECT USING (public.tjs_is_admin(auth.uid()));


--
-- Name: events Allow authenticated to delete events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated to delete events" ON public.events FOR DELETE TO authenticated USING (true);


--
-- Name: events Allow authenticated to insert events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated to insert events" ON public.events FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: event_artists Allow authenticated to manage event_artists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated to manage event_artists" ON public.event_artists TO authenticated USING (true) WITH CHECK (true);


--
-- Name: event_dates Allow authenticated to manage event_dates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated to manage event_dates" ON public.event_dates TO authenticated USING (true) WITH CHECK (true);


--
-- Name: event_instruments Allow authenticated to manage event_instruments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated to manage event_instruments" ON public.event_instruments TO authenticated USING (true) WITH CHECK (true);


--
-- Name: event_media Allow authenticated to manage event_media; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated to manage event_media" ON public.event_media TO authenticated USING (true) WITH CHECK (true);


--
-- Name: events Allow authenticated to select events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated to select events" ON public.events FOR SELECT TO authenticated USING (true);


--
-- Name: events Allow authenticated to update events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated to update events" ON public.events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: tjs_artists Artists update own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Artists update own data" ON public.tjs_artists FOR UPDATE USING ((profile_id = auth.uid()));


--
-- Name: tjs_profiles Artists view artist profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Artists view artist profiles" ON public.tjs_profiles FOR SELECT USING ((public.tjs_has_role(auth.uid(), 'Artist'::text) AND (EXISTS ( SELECT 1
   FROM public.tjs_artists a
  WHERE (a.profile_id = tjs_profiles.id)))));


--
-- Name: tjs_artists Artists view own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Artists view own data" ON public.tjs_artists FOR SELECT USING ((profile_id = auth.uid()));


--
-- Name: tjs_roles Authenticated users can view roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view roles" ON public.tjs_roles FOR SELECT TO authenticated USING (true);


--
-- Name: tjs_profiles Committee view profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Committee view profiles" ON public.tjs_profiles FOR SELECT USING ((public.tjs_has_role(auth.uid(), 'Committee Member'::text) AND (EXISTS ( SELECT 1
   FROM public.tjs_artists a
  WHERE (a.profile_id = tjs_profiles.id)))));


--
-- Name: profiles Enable delete for users based on user_id; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete for users based on user_id" ON public.profiles FOR DELETE TO authenticated, anon USING (true);


--
-- Name: user_profile Enable delete for users based on user_id; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete for users based on user_id" ON public.user_profile FOR DELETE TO authenticated, anon USING (true);


--
-- Name: profiles Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for authenticated users only" ON public.profiles FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- Name: user_profile Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for authenticated users only" ON public.user_profile FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- Name: profiles Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.profiles FOR SELECT TO authenticated, anon USING (true);


--
-- Name: sys_artist_performance Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.sys_artist_performance FOR SELECT TO authenticated, anon USING (true);


--
-- Name: events Hosts can create events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Hosts can create events" ON public.events FOR INSERT TO authenticated WITH CHECK ((auth.uid() = created_by));


--
-- Name: events Hosts can delete their own events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Hosts can delete their own events" ON public.events FOR DELETE TO authenticated USING ((auth.uid() = created_by));


--
-- Name: events Hosts can update their own events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Hosts can update their own events" ON public.events FOR UPDATE TO authenticated USING ((auth.uid() = created_by)) WITH CHECK ((auth.uid() = created_by));


--
-- Name: events Hosts can view their own events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Hosts can view their own events" ON public.events FOR SELECT TO authenticated USING (((auth.uid() = created_by) OR (auth.uid() = updated_by)));


--
-- Name: tjs_host_members Hosts can view their own memberships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Hosts can view their own memberships" ON public.tjs_host_members FOR SELECT USING ((profile_id = auth.uid()));


--
-- Name: profiles Policy with table joins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Policy with table joins" ON public.profiles FOR UPDATE USING (true);


--
-- Name: event_edition Public can view edition details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view edition details" ON public.event_edition FOR SELECT USING (true);


--
-- Name: sys_event_domain Public can view event domains; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view event domains" ON public.sys_event_domain FOR SELECT USING (true);


--
-- Name: sys_event_edition Public can view event editions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view event editions" ON public.sys_event_edition FOR SELECT USING (true);


--
-- Name: sys_event_type Public can view event types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view event types" ON public.sys_event_type FOR SELECT USING (true);


--
-- Name: tjs_roles Public read access to roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access to roles" ON public.tjs_roles FOR SELECT TO anon USING (true);


--
-- Name: event_edition Public read event_edition; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read event_edition" ON public.event_edition FOR SELECT USING (true);


--
-- Name: sys_event_domain Public read sys_event_domain; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read sys_event_domain" ON public.sys_event_domain FOR SELECT USING (true);


--
-- Name: sys_event_edition Public read sys_event_edition; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read sys_event_edition" ON public.sys_event_edition FOR SELECT USING (true);


--
-- Name: sys_event_type Public read sys_event_type; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read sys_event_type" ON public.sys_event_type FOR SELECT USING (true);


--
-- Name: tjs_artists TJS users view artists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "TJS users view artists" ON public.tjs_artists FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.tjs_user_roles
  WHERE (tjs_user_roles.user_id = auth.uid()))));


--
-- Name: event_media Users can add event media; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add event media" ON public.event_media FOR INSERT TO authenticated WITH CHECK ((auth.uid() = created_by));


--
-- Name: event_dates Users can create event dates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create event dates" ON public.event_dates FOR INSERT TO authenticated WITH CHECK ((auth.uid() = created_by));


--
-- Name: event_artists Users can delete their event artists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their event artists" ON public.event_artists FOR DELETE TO authenticated USING ((auth.uid() = created_by));


--
-- Name: event_dates Users can delete their event dates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their event dates" ON public.event_dates FOR DELETE TO authenticated USING ((auth.uid() = created_by));


--
-- Name: event_instruments Users can delete their event instruments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their event instruments" ON public.event_instruments FOR DELETE TO authenticated USING ((auth.uid() = created_by));


--
-- Name: event_media Users can delete their event media; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their event media" ON public.event_media FOR DELETE TO authenticated USING ((auth.uid() = created_by));


--
-- Name: event_artists Users can link artists to events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can link artists to events" ON public.event_artists FOR INSERT TO authenticated WITH CHECK ((auth.uid() = created_by));


--
-- Name: event_instruments Users can link instruments to events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can link instruments to events" ON public.event_instruments FOR INSERT TO authenticated WITH CHECK ((auth.uid() = created_by));


--
-- Name: event_artists Users can update their event artists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their event artists" ON public.event_artists FOR UPDATE TO authenticated USING ((auth.uid() = created_by)) WITH CHECK ((auth.uid() = created_by));


--
-- Name: event_dates Users can update their event dates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their event dates" ON public.event_dates FOR UPDATE TO authenticated USING ((auth.uid() = created_by)) WITH CHECK ((auth.uid() = created_by));


--
-- Name: event_instruments Users can update their event instruments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their event instruments" ON public.event_instruments FOR UPDATE TO authenticated USING ((auth.uid() = created_by)) WITH CHECK ((auth.uid() = created_by));


--
-- Name: event_media Users can update their event media; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their event media" ON public.event_media FOR UPDATE TO authenticated USING ((auth.uid() = created_by)) WITH CHECK ((auth.uid() = created_by));


--
-- Name: event_artists Users can view event artists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view event artists" ON public.event_artists FOR SELECT TO authenticated USING (true);


--
-- Name: event_dates Users can view event dates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view event dates" ON public.event_dates FOR SELECT TO authenticated USING (true);


--
-- Name: event_instruments Users can view event instruments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view event instruments" ON public.event_instruments FOR SELECT TO authenticated USING (true);


--
-- Name: event_media Users can view event media; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view event media" ON public.event_media FOR SELECT TO authenticated USING (true);


--
-- Name: tjs_profiles Users update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users update own profile" ON public.tjs_profiles FOR UPDATE USING ((id = auth.uid()));


--
-- Name: tjs_profiles Users view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own profile" ON public.tjs_profiles FOR SELECT USING ((id = auth.uid()));


--
-- Name: tjs_user_roles Users view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own roles" ON public.tjs_user_roles FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: artist_availability; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.artist_availability ENABLE ROW LEVEL SECURITY;

--
-- Name: artist_awards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.artist_awards ENABLE ROW LEVEL SECURITY;

--
-- Name: artist_education; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.artist_education ENABLE ROW LEVEL SECURITY;

--
-- Name: artist_instruments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.artist_instruments ENABLE ROW LEVEL SECURITY;

--
-- Name: artist_media; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.artist_media ENABLE ROW LEVEL SECURITY;

--
-- Name: artist_performance; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.artist_performance ENABLE ROW LEVEL SECURITY;

--
-- Name: artist_request; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.artist_request ENABLE ROW LEVEL SECURITY;

--
-- Name: artist_request artist_request_insert_authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artist_request_insert_authenticated ON public.artist_request FOR INSERT WITH CHECK ((( SELECT auth.role() AS role) = 'authenticated'::text));


--
-- Name: artist_request_media; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.artist_request_media ENABLE ROW LEVEL SECURITY;

--
-- Name: artist_request_media artist_request_media_insert_authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artist_request_media_insert_authenticated ON public.artist_request_media FOR INSERT WITH CHECK ((( SELECT auth.role() AS role) = 'authenticated'::text));


--
-- Name: artist_request_media artist_request_media_select_public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artist_request_media_select_public ON public.artist_request_media FOR SELECT USING (true);


--
-- Name: artist_request_media artist_request_media_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artist_request_media_update_own ON public.artist_request_media FOR UPDATE USING (((created_by = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.artist_request
  WHERE ((artist_request.id = artist_request_media.id_request) AND ((EXISTS ( SELECT 1
           FROM public.artists
          WHERE ((artists.id = artist_request.id_artist) AND (artists.id_profile = ( SELECT auth.uid() AS uid))))) OR (EXISTS ( SELECT 1
           FROM public.hosts
          WHERE ((hosts.id = artist_request.id_host) AND (hosts.created_by = ( SELECT auth.uid() AS uid)))))))))));


--
-- Name: artist_request artist_request_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artist_request_select_own ON public.artist_request FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.artists
  WHERE ((artists.id = artist_request.id_artist) AND (artists.id_profile = ( SELECT auth.uid() AS uid))))) OR (EXISTS ( SELECT 1
   FROM public.hosts
  WHERE ((hosts.id = artist_request.id_host) AND (hosts.created_by = ( SELECT auth.uid() AS uid)))))));


--
-- Name: artist_request artist_request_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artist_request_update_own ON public.artist_request FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM public.artists
  WHERE ((artists.id = artist_request.id_artist) AND (artists.id_profile = ( SELECT auth.uid() AS uid))))) OR (EXISTS ( SELECT 1
   FROM public.hosts
  WHERE ((hosts.id = artist_request.id_host) AND (hosts.created_by = ( SELECT auth.uid() AS uid)))))));


--
-- Name: artist_requirement; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.artist_requirement ENABLE ROW LEVEL SECURITY;

--
-- Name: artists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;

--
-- Name: artists artists_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artists_delete_own ON public.artists FOR DELETE USING ((auth.uid() = id_profile));


--
-- Name: artists artists_insert_authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artists_insert_authenticated ON public.artists FOR INSERT WITH CHECK ((( SELECT auth.role() AS role) = 'authenticated'::text));


--
-- Name: artists artists_select_public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artists_select_public ON public.artists FOR SELECT USING (true);


--
-- Name: artists artists_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY artists_update_own ON public.artists FOR UPDATE USING (true);


--
-- Name: event_artists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_artists ENABLE ROW LEVEL SECURITY;

--
-- Name: event_artists event_artists_manage_authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_artists_manage_authenticated ON public.event_artists USING ((( SELECT auth.role() AS role) = 'authenticated'::text));


--
-- Name: event_artists event_artists_select_public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_artists_select_public ON public.event_artists FOR SELECT USING (true);


--
-- Name: event_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: event_dates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_dates ENABLE ROW LEVEL SECURITY;

--
-- Name: event_edition; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_edition ENABLE ROW LEVEL SECURITY;

--
-- Name: event_instruments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_instruments ENABLE ROW LEVEL SECURITY;

--
-- Name: event_media; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_media ENABLE ROW LEVEL SECURITY;

--
-- Name: events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

--
-- Name: host_users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.host_users ENABLE ROW LEVEL SECURITY;

--
-- Name: hosts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hosts ENABLE ROW LEVEL SECURITY;

--
-- Name: location_amenity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.location_amenity ENABLE ROW LEVEL SECURITY;

--
-- Name: location_images; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.location_images ENABLE ROW LEVEL SECURITY;

--
-- Name: location_specs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.location_specs ENABLE ROW LEVEL SECURITY;

--
-- Name: location_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.location_types ENABLE ROW LEVEL SECURITY;

--
-- Name: locations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

--
-- Name: newsletter; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.newsletter ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: artist_availability public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.artist_availability FOR DELETE USING (true);


--
-- Name: artist_awards public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.artist_awards FOR DELETE USING (true);


--
-- Name: artist_education public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.artist_education FOR DELETE USING (true);


--
-- Name: artist_instruments public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.artist_instruments FOR DELETE USING (true);


--
-- Name: artist_media public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.artist_media FOR DELETE USING (true);


--
-- Name: artist_performance public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.artist_performance FOR DELETE USING (true);


--
-- Name: artist_requirement public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.artist_requirement FOR DELETE USING (true);


--
-- Name: event_comments public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.event_comments FOR DELETE USING (true);


--
-- Name: event_dates public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.event_dates FOR DELETE USING (true);


--
-- Name: event_edition public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.event_edition FOR DELETE USING (true);


--
-- Name: event_instruments public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.event_instruments FOR DELETE USING (true);


--
-- Name: event_media public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.event_media FOR DELETE USING (true);


--
-- Name: events public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.events FOR DELETE USING (true);


--
-- Name: host_users public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.host_users FOR DELETE USING (true);


--
-- Name: hosts public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.hosts FOR DELETE USING (true);


--
-- Name: location_amenity public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.location_amenity FOR DELETE USING (true);


--
-- Name: location_images public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.location_images FOR DELETE USING (true);


--
-- Name: location_specs public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.location_specs FOR DELETE USING (true);


--
-- Name: location_types public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.location_types FOR DELETE USING (true);


--
-- Name: locations public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.locations FOR DELETE USING (true);


--
-- Name: newsletter public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.newsletter FOR DELETE USING (true);


--
-- Name: sys_event_domain public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.sys_event_domain FOR DELETE USING (true);


--
-- Name: sys_event_edition public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.sys_event_edition FOR DELETE USING (true);


--
-- Name: sys_event_type public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.sys_event_type FOR DELETE USING (true);


--
-- Name: sys_host_types public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.sys_host_types FOR DELETE USING (true);


--
-- Name: sys_instruments public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.sys_instruments FOR DELETE USING (true);


--
-- Name: sys_location_amenity public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.sys_location_amenity FOR DELETE USING (true);


--
-- Name: sys_location_specs public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.sys_location_specs FOR DELETE USING (true);


--
-- Name: sys_location_types public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.sys_location_types FOR DELETE USING (true);


--
-- Name: sys_media_type public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.sys_media_type FOR DELETE USING (true);


--
-- Name: sys_request_type public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.sys_request_type FOR DELETE USING (true);


--
-- Name: tjs_messages public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.tjs_messages FOR DELETE USING (true);


--
-- Name: user_roles public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.user_roles FOR DELETE USING (true);


--
-- Name: visitor_message public delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public delete" ON public.visitor_message FOR DELETE USING (true);


--
-- Name: artist_availability public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.artist_availability FOR INSERT WITH CHECK (true);


--
-- Name: artist_awards public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.artist_awards FOR INSERT WITH CHECK (true);


--
-- Name: artist_education public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.artist_education FOR INSERT WITH CHECK (true);


--
-- Name: artist_instruments public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.artist_instruments FOR INSERT WITH CHECK (true);


--
-- Name: artist_media public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.artist_media FOR INSERT WITH CHECK (true);


--
-- Name: artist_performance public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.artist_performance FOR INSERT WITH CHECK (true);


--
-- Name: artist_requirement public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.artist_requirement FOR INSERT WITH CHECK (true);


--
-- Name: event_comments public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.event_comments FOR INSERT WITH CHECK (true);


--
-- Name: event_dates public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.event_dates FOR INSERT WITH CHECK (true);


--
-- Name: event_edition public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.event_edition FOR INSERT WITH CHECK (true);


--
-- Name: event_instruments public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.event_instruments FOR INSERT WITH CHECK (true);


--
-- Name: event_media public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.event_media FOR INSERT WITH CHECK (true);


--
-- Name: events public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.events FOR INSERT WITH CHECK (true);


--
-- Name: host_users public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.host_users FOR INSERT WITH CHECK (true);


--
-- Name: hosts public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.hosts FOR INSERT WITH CHECK (true);


--
-- Name: location_amenity public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.location_amenity FOR INSERT WITH CHECK (true);


--
-- Name: location_images public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.location_images FOR INSERT WITH CHECK (true);


--
-- Name: location_specs public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.location_specs FOR INSERT WITH CHECK (true);


--
-- Name: location_types public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.location_types FOR INSERT WITH CHECK (true);


--
-- Name: locations public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.locations FOR INSERT WITH CHECK (true);


--
-- Name: newsletter public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.newsletter FOR INSERT WITH CHECK (true);


--
-- Name: sys_event_domain public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.sys_event_domain FOR INSERT WITH CHECK (true);


--
-- Name: sys_event_edition public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.sys_event_edition FOR INSERT WITH CHECK (true);


--
-- Name: sys_event_type public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.sys_event_type FOR INSERT WITH CHECK (true);


--
-- Name: sys_host_types public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.sys_host_types FOR INSERT WITH CHECK (true);


--
-- Name: sys_instruments public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.sys_instruments FOR INSERT WITH CHECK (true);


--
-- Name: sys_location_amenity public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.sys_location_amenity FOR INSERT WITH CHECK (true);


--
-- Name: sys_location_specs public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.sys_location_specs FOR INSERT WITH CHECK (true);


--
-- Name: sys_location_types public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.sys_location_types FOR INSERT WITH CHECK (true);


--
-- Name: sys_media_type public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.sys_media_type FOR INSERT WITH CHECK (true);


--
-- Name: sys_request_type public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.sys_request_type FOR INSERT WITH CHECK (true);


--
-- Name: tjs_messages public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.tjs_messages FOR INSERT WITH CHECK (true);


--
-- Name: user_roles public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.user_roles FOR INSERT WITH CHECK (true);


--
-- Name: visitor_message public insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public insert" ON public.visitor_message FOR INSERT WITH CHECK (true);


--
-- Name: artist_availability public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.artist_availability FOR SELECT USING (true);


--
-- Name: artist_awards public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.artist_awards FOR SELECT USING (true);


--
-- Name: artist_education public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.artist_education FOR SELECT USING (true);


--
-- Name: artist_instruments public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.artist_instruments FOR SELECT USING (true);


--
-- Name: artist_media public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.artist_media FOR SELECT USING (true);


--
-- Name: artist_performance public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.artist_performance FOR SELECT USING (true);


--
-- Name: artist_requirement public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.artist_requirement FOR SELECT USING (true);


--
-- Name: event_comments public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.event_comments FOR SELECT USING (true);


--
-- Name: event_dates public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.event_dates FOR SELECT USING (true);


--
-- Name: event_edition public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.event_edition FOR SELECT USING (true);


--
-- Name: event_instruments public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.event_instruments FOR SELECT USING (true);


--
-- Name: event_media public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.event_media FOR SELECT USING (true);


--
-- Name: events public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.events FOR SELECT USING (true);


--
-- Name: host_users public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.host_users FOR SELECT USING (true);


--
-- Name: hosts public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.hosts FOR SELECT USING (true);


--
-- Name: location_amenity public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.location_amenity FOR SELECT USING (true);


--
-- Name: location_images public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.location_images FOR SELECT USING (true);


--
-- Name: location_specs public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.location_specs FOR SELECT USING (true);


--
-- Name: location_types public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.location_types FOR SELECT USING (true);


--
-- Name: locations public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.locations FOR SELECT USING (true);


--
-- Name: newsletter public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.newsletter FOR SELECT USING (true);


--
-- Name: sys_event_domain public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.sys_event_domain FOR SELECT USING (true);


--
-- Name: sys_event_edition public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.sys_event_edition FOR SELECT USING (true);


--
-- Name: sys_event_type public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.sys_event_type FOR SELECT USING (true);


--
-- Name: sys_host_types public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.sys_host_types FOR SELECT USING (true);


--
-- Name: sys_instruments public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.sys_instruments FOR SELECT USING (true);


--
-- Name: sys_location_amenity public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.sys_location_amenity FOR SELECT USING (true);


--
-- Name: sys_location_specs public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.sys_location_specs FOR SELECT USING (true);


--
-- Name: sys_location_types public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.sys_location_types FOR SELECT USING (true);


--
-- Name: sys_media_type public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.sys_media_type FOR SELECT USING (true);


--
-- Name: sys_request_type public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.sys_request_type FOR SELECT USING (true);


--
-- Name: tjs_messages public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.tjs_messages FOR SELECT USING (true);


--
-- Name: user_roles public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.user_roles FOR SELECT USING (true);


--
-- Name: visitor_message public select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public select" ON public.visitor_message FOR SELECT USING (true);


--
-- Name: artist_availability public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.artist_availability FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: artist_awards public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.artist_awards FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: artist_education public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.artist_education FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: artist_instruments public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.artist_instruments FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: artist_media public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.artist_media FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: artist_performance public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.artist_performance FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: artist_requirement public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.artist_requirement FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: event_comments public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.event_comments FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: event_dates public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.event_dates FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: event_edition public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.event_edition FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: event_instruments public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.event_instruments FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: event_media public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.event_media FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: events public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.events FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: host_users public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.host_users FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: hosts public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.hosts FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: location_amenity public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.location_amenity FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: location_images public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.location_images FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: location_specs public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.location_specs FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: location_types public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.location_types FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: locations public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.locations FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: newsletter public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.newsletter FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: sys_event_domain public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.sys_event_domain FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: sys_event_edition public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.sys_event_edition FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: sys_event_type public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.sys_event_type FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: sys_host_types public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.sys_host_types FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: sys_instruments public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.sys_instruments FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: sys_location_amenity public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.sys_location_amenity FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: sys_location_specs public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.sys_location_specs FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: sys_location_types public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.sys_location_types FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: sys_media_type public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.sys_media_type FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: sys_request_type public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.sys_request_type FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: tjs_messages public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.tjs_messages FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: user_roles public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.user_roles FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: visitor_message public update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public update" ON public.visitor_message FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: sys_artist_performance; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sys_artist_performance ENABLE ROW LEVEL SECURITY;

--
-- Name: sys_event_domain; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sys_event_domain ENABLE ROW LEVEL SECURITY;

--
-- Name: sys_event_edition; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sys_event_edition ENABLE ROW LEVEL SECURITY;

--
-- Name: sys_event_type; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sys_event_type ENABLE ROW LEVEL SECURITY;

--
-- Name: sys_host_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sys_host_types ENABLE ROW LEVEL SECURITY;

--
-- Name: sys_instruments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sys_instruments ENABLE ROW LEVEL SECURITY;

--
-- Name: sys_location_amenity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sys_location_amenity ENABLE ROW LEVEL SECURITY;

--
-- Name: sys_location_specs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sys_location_specs ENABLE ROW LEVEL SECURITY;

--
-- Name: sys_location_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sys_location_types ENABLE ROW LEVEL SECURITY;

--
-- Name: sys_media_type; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sys_media_type ENABLE ROW LEVEL SECURITY;

--
-- Name: sys_request_type; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sys_request_type ENABLE ROW LEVEL SECURITY;

--
-- Name: tjs_artists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tjs_artists ENABLE ROW LEVEL SECURITY;

--
-- Name: tjs_host_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tjs_host_members ENABLE ROW LEVEL SECURITY;

--
-- Name: tjs_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tjs_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: tjs_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tjs_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: tjs_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tjs_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: tjs_user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tjs_user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_profile; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

--
-- Name: user_profile user_profile_select_public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_profile_select_public ON public.user_profile FOR SELECT TO authenticated, anon USING (true);


--
-- Name: user_profile user_profile_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_profile_update_own ON public.user_profile FOR UPDATE TO authenticated, anon USING ((id_user = ( SELECT auth.uid() AS uid)));


--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: visitor_message; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.visitor_message ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

\unrestrict MXWL0rvfK7KgSZYQcPUx0Nr7DZFzwQ5e4aJzcx4JXNYAtpsCZVErZSDxSJVtzUa

