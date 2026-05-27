-- ============================================================
-- Migration 0001 — Auth hook, triggers, RLS, and grant revocation
-- Apply AFTER 0000_initial_schema.sql
-- Apply with: psql $DATABASE_URL -f migrations/0001_auth_hook_and_rls.sql
--
-- ⚠️  CRITICAL (B9): All three supabase_auth_admin grants MUST stay in
-- this migration. Separating them causes a total login outage the moment
-- the first user tries to authenticate.
-- ============================================================

-- ── 1. Revoke direct table access from the client-facing Supabase roles ─────
-- The BFF connects with the service role and is the only data path.
-- authenticated/anon clients should never touch these tables directly.

REVOKE ALL ON TABLE public.users          FROM authenticated, anon;
REVOKE ALL ON TABLE public.projects       FROM authenticated, anon;
REVOKE ALL ON TABLE public.tasks          FROM authenticated, anon;
REVOKE ALL ON TABLE public.user_projects  FROM authenticated, anon;
REVOKE ALL ON TABLE public.time_entries   FROM authenticated, anon;
REVOKE ALL ON TABLE public.timer_sessions FROM authenticated, anon;

-- ── 2. Enable RLS on all tables (belt-and-braces; grants are the real guard) ─

ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_projects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timer_sessions ENABLE ROW LEVEL SECURITY;

-- Deny-all policies for authenticated
CREATE POLICY "deny_all_authenticated_users"         ON public.users          FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_all_authenticated_projects"      ON public.projects       FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_all_authenticated_tasks"         ON public.tasks          FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_all_authenticated_user_projects" ON public.user_projects  FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_all_authenticated_time_entries"  ON public.time_entries   FOR ALL TO authenticated USING (false);
CREATE POLICY "deny_all_authenticated_timer_sessions" ON public.timer_sessions FOR ALL TO authenticated USING (false);

-- Deny-all policies for anon
CREATE POLICY "deny_all_anon_users"          ON public.users          FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_anon_projects"       ON public.projects       FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_anon_tasks"          ON public.tasks          FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_anon_user_projects"  ON public.user_projects  FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_anon_time_entries"   ON public.time_entries   FOR ALL TO anon USING (false);
CREATE POLICY "deny_all_anon_timer_sessions" ON public.timer_sessions FOR ALL TO anon USING (false);

-- ── 3. updated_at trigger ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_projects
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_tasks
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_time_entries
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 4. Custom access token hook ──────────────────────────────────────────────
-- Injects role, is_active, and full_name into every JWT issued by Supabase Auth.
-- TTL is set to 15 minutes in Supabase Auth dashboard (D0-08).
--
-- After applying this migration, register the function in:
--   Supabase Dashboard → Authentication → Hooks → Custom Access Token
--   → set to: public.custom_access_token_hook

-- ⚠️  These three grants MUST be in the same migration as the hook function.
-- supabase_auth_admin has no access to public schema by default.
-- Missing any grant causes a total login outage on the first token issuance.
GRANT USAGE  ON SCHEMA public                               TO supabase_auth_admin;
GRANT SELECT ON TABLE  public.users                         TO supabase_auth_admin;

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  claims         jsonb;
  user_role      text;
  user_active    boolean;
  user_full_name text;
BEGIN
  SELECT role::text, is_active, full_name
    INTO user_role, user_active, user_full_name
    FROM public.users
    WHERE id = (event->>'user_id')::uuid;

  claims := event->'claims';
  claims := jsonb_set(claims, '{app_metadata,role}',
    to_jsonb(COALESCE(user_role, 'employee')));
  claims := jsonb_set(claims, '{app_metadata,is_active}',
    to_jsonb(COALESCE(user_active, false)));
  claims := jsonb_set(claims, '{app_metadata,full_name}',
    to_jsonb(COALESCE(user_full_name, '')));

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- ── 5. Verification queries (run after applying; used in Stage 1 gate) ───────
-- Check supabase_auth_admin grants are present:
--
-- SELECT grantee, table_name, privilege_type
--   FROM information_schema.role_table_grants
--   WHERE grantee = 'supabase_auth_admin' AND table_name = 'users';
-- → must show SELECT
--
-- SELECT has_schema_privilege('supabase_auth_admin', 'public', 'USAGE');
-- → must return true
--
-- SELECT has_function_privilege('supabase_auth_admin',
--   'public.custom_access_token_hook(jsonb)', 'EXECUTE');
-- → must return true
