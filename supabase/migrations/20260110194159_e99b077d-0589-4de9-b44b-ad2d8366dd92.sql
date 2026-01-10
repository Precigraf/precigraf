-- Ensure RLS is enabled and forced on sensitive tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculations FORCE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- Recreate restrictive policies (idempotent via drop+create)
DO $$
BEGIN
  -- users
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='users' AND policyname='Users can view their own data') THEN
    EXECUTE 'DROP POLICY "Users can view their own data" ON public.users';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='users' AND policyname='Users can insert their own data') THEN
    EXECUTE 'DROP POLICY "Users can insert their own data" ON public.users';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='users' AND policyname='Users can update their own data') THEN
    EXECUTE 'DROP POLICY "Users can update their own data" ON public.users';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='users' AND policyname='Users can delete their own data') THEN
    EXECUTE 'DROP POLICY "Users can delete their own data" ON public.users';
  END IF;

  EXECUTE 'CREATE POLICY "Users can view their own data" ON public.users FOR SELECT USING (auth.uid() = user_id)';
  EXECUTE 'CREATE POLICY "Users can insert their own data" ON public.users FOR INSERT WITH CHECK (auth.uid() = user_id)';
  EXECUTE 'CREATE POLICY "Users can update their own data" ON public.users FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  EXECUTE 'CREATE POLICY "Users can delete their own data" ON public.users FOR DELETE USING (auth.uid() = user_id)';

  -- profiles
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can view their own profile') THEN
    EXECUTE 'DROP POLICY "Users can view their own profile" ON public.profiles';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can insert their own profile') THEN
    EXECUTE 'DROP POLICY "Users can insert their own profile" ON public.profiles';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can update their own profile') THEN
    EXECUTE 'DROP POLICY "Users can update their own profile" ON public.profiles';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can delete their own profile') THEN
    EXECUTE 'DROP POLICY "Users can delete their own profile" ON public.profiles';
  END IF;

  EXECUTE 'CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id)';
  EXECUTE 'CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id)';
  EXECUTE 'CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id)';
  EXECUTE 'CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE USING (auth.uid() = user_id)';

  -- calculations
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='calculations' AND policyname='Users can view their own calculations') THEN
    EXECUTE 'DROP POLICY "Users can view their own calculations" ON public.calculations';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='calculations' AND policyname='Users can insert their own calculations') THEN
    EXECUTE 'DROP POLICY "Users can insert their own calculations" ON public.calculations';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='calculations' AND policyname='Users can update their own calculations') THEN
    EXECUTE 'DROP POLICY "Users can update their own calculations" ON public.calculations';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='calculations' AND policyname='Users can delete their own calculations') THEN
    EXECUTE 'DROP POLICY "Users can delete their own calculations" ON public.calculations';
  END IF;

  EXECUTE 'CREATE POLICY "Users can view their own calculations" ON public.calculations FOR SELECT USING (auth.uid() = user_id)';
  EXECUTE 'CREATE POLICY "Users can insert their own calculations" ON public.calculations FOR INSERT WITH CHECK (auth.uid() = user_id)';
  EXECUTE 'CREATE POLICY "Users can update their own calculations" ON public.calculations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  EXECUTE 'CREATE POLICY "Users can delete their own calculations" ON public.calculations FOR DELETE USING (auth.uid() = user_id)';
END $$;