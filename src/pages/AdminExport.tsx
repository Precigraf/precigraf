import React, { forwardRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Database, Users, HardDrive, FileCode, Shield, ScrollText, Copy, Check, Loader2, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TABLES = [
  { name: 'profiles', label: 'Profiles', icon: Users, description: 'Dados de perfis de usuários' },
  { name: 'users', label: 'Users', icon: Users, description: 'Dados de autenticação de usuários' },
  { name: 'calculations', label: 'Calculations', icon: Table, description: 'Cálculos salvos' },
  { name: 'subscription_plans', label: 'Subscription Plans', icon: Shield, description: 'Planos de assinatura' },
  { name: 'user_roles', label: 'User Roles', icon: Shield, description: 'Papéis de usuários' },
  { name: 'device_fingerprints', label: 'Device Fingerprints', icon: HardDrive, description: 'Impressões digitais de dispositivos' },
  { name: 'security_logs', label: 'Security Logs', icon: ScrollText, description: 'Logs de segurança' },
  { name: 'pending_payments', label: 'Pending Payments', icon: FileCode, description: 'Pagamentos pendentes' },
  { name: 'rate_limits', label: 'Rate Limits', icon: Shield, description: 'Limites de requisição' },
];

const SQL_SCHEMAS = `-- ================================================
-- ESQUEMA COMPLETO DO BANCO DE DADOS - PreciGraf
-- Gerado em: ${new Date().toISOString().split('T')[0]}
-- ================================================

-- ========== ENUM ==========
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- ========== TABELAS ==========

-- Tabela: subscription_plans
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  max_calculations INTEGER NOT NULL,
  can_export BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans FORCE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view subscription plans" ON public.subscription_plans FOR SELECT USING (true);
CREATE POLICY "No insert to subscription plans" ON public.subscription_plans FOR INSERT WITH CHECK (false);
CREATE POLICY "No update to subscription plans" ON public.subscription_plans FOR UPDATE USING (false);
CREATE POLICY "No delete from subscription plans" ON public.subscription_plans FOR DELETE USING (false);

-- Tabela: profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  plan_id UUID REFERENCES public.subscription_plans(id),
  trial_ends_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '1 day'),
  monthly_edits_count INTEGER NOT NULL DEFAULT 0,
  monthly_edits_reset_at TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', now()) + INTERVAL '1 month'),
  profile_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Tabela: users
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data" ON public.users FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can insert their own data" ON public.users FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own data" ON public.users FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tabela: calculations
CREATE TABLE public.calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  cost_type TEXT NOT NULL DEFAULT 'lot',
  lot_quantity INTEGER NOT NULL DEFAULT 500,
  lot_cost NUMERIC NOT NULL DEFAULT 0,
  paper_cost NUMERIC NOT NULL DEFAULT 0,
  ink_cost NUMERIC NOT NULL DEFAULT 0,
  varnish_cost NUMERIC NOT NULL DEFAULT 0,
  other_material_cost NUMERIC NOT NULL DEFAULT 0,
  labor_cost NUMERIC NOT NULL DEFAULT 0,
  energy_cost NUMERIC NOT NULL DEFAULT 0,
  equipment_cost NUMERIC NOT NULL DEFAULT 0,
  rent_cost NUMERIC NOT NULL DEFAULT 0,
  other_operational_cost NUMERIC NOT NULL DEFAULT 0,
  margin_percentage NUMERIC NOT NULL DEFAULT 70,
  fixed_profit NUMERIC,
  total_cost NUMERIC NOT NULL,
  profit NUMERIC NOT NULL,
  sale_price NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  duplicated_from UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calculations" ON public.calculations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own calculations" ON public.calculations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own calculations" ON public.calculations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own calculations" ON public.calculations FOR DELETE USING (auth.uid() = user_id);

-- Tabela: user_roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can update roles" ON public.user_roles FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can delete roles" ON public.user_roles FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Tabela: device_fingerprints
CREATE TABLE public.device_fingerprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  fingerprint_hash TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_fingerprints FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fingerprints" ON public.device_fingerprints FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fingerprints" ON public.device_fingerprints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "No update to device fingerprints" ON public.device_fingerprints FOR UPDATE USING (false);
CREATE POLICY "No delete from device fingerprints" ON public.device_fingerprints FOR DELETE USING (false);

-- Tabela: security_logs
CREATE TABLE public.security_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  event_type TEXT NOT NULL,
  event_description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs FORCE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all security logs" ON public.security_logs FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own security logs" ON public.security_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "No update to security logs" ON public.security_logs FOR UPDATE USING (false);
CREATE POLICY "No delete from security logs" ON public.security_logs FOR DELETE USING (false);

-- Tabela: pending_payments
CREATE TABLE public.pending_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  csrf_token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_provider_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 hour'),
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.pending_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_payments FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own pending payments" ON public.pending_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "No direct SELECT access to pending_payments" ON public.pending_payments FOR SELECT USING (false);
CREATE POLICY "No direct update to pending_payments" ON public.pending_payments FOR UPDATE USING (false);
CREATE POLICY "No direct delete from pending_payments" ON public.pending_payments FOR DELETE USING (false);

-- Tabela: rate_limits
CREATE TABLE public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  action_type TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(identifier, action_type)
);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to rate_limits" ON public.rate_limits FOR SELECT USING (false);
CREATE POLICY "No direct insert to rate_limits" ON public.rate_limits FOR INSERT WITH CHECK (false);
CREATE POLICY "No direct update to rate_limits" ON public.rate_limits FOR UPDATE USING (false);
CREATE POLICY "No direct delete to rate_limits" ON public.rate_limits FOR DELETE USING (false);

-- ========== VIEW ==========

CREATE VIEW public.pending_payments_safe AS
SELECT id, user_id, status, created_at, expires_at, completed_at
FROM public.pending_payments;

-- ========== FUNCTIONS ==========

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF _user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN RETURN false; END IF;
  RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
END; $$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_role app_role;
BEGIN
  IF _user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN RETURN NULL; END IF;
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
  RETURN v_role;
END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, plan, trial_ends_at)
  VALUES (NEW.id, NEW.email, 'free', NOW() + INTERVAL '1 day') ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.users (user_id, email, name, status)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), 'ativo') ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.security_logs (user_id, event_type, event_description) VALUES (NEW.id, 'user_created', 'New user account created');
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.check_edit_limit(p_user_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_plan TEXT; v_trial_ends_at TIMESTAMPTZ; v_is_trial_active BOOLEAN;
  v_monthly_edits_count INTEGER; v_monthly_edits_reset_at TIMESTAMPTZ; v_max_edits_free INTEGER := 3;
BEGIN
  SELECT plan, trial_ends_at, monthly_edits_count, monthly_edits_reset_at
  INTO v_plan, v_trial_ends_at, v_monthly_edits_count, v_monthly_edits_reset_at
  FROM public.profiles WHERE user_id = p_user_id;
  IF v_plan = 'pro' THEN RETURN json_build_object('allowed', true, 'remaining', -1, 'plan', 'pro'); END IF;
  IF v_monthly_edits_reset_at <= NOW() THEN
    UPDATE public.profiles SET monthly_edits_count = 0, monthly_edits_reset_at = date_trunc('month', NOW()) + INTERVAL '1 month' WHERE user_id = p_user_id;
    v_monthly_edits_count := 0;
  END IF;
  v_is_trial_active := v_trial_ends_at IS NOT NULL AND v_trial_ends_at > NOW();
  IF NOT v_is_trial_active THEN RETURN json_build_object('allowed', false, 'reason', 'trial_expired'); END IF;
  IF v_monthly_edits_count >= v_max_edits_free THEN
    RETURN json_build_object('allowed', false, 'reason', 'edit_limit_reached', 'count', v_monthly_edits_count, 'max', v_max_edits_free);
  END IF;
  RETURN json_build_object('allowed', true, 'remaining', v_max_edits_free - v_monthly_edits_count, 'count', v_monthly_edits_count, 'max', v_max_edits_free, 'plan', 'trial');
END; $$;

CREATE OR REPLACE FUNCTION public.increment_edit_count(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN UPDATE public.profiles SET monthly_edits_count = monthly_edits_count + 1 WHERE user_id = p_user_id; END; $$;

CREATE OR REPLACE FUNCTION public.validate_user_plan(p_user_id uuid, p_feature text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_plan TEXT; v_trial_ends_at TIMESTAMPTZ; v_is_trial_active BOOLEAN;
  v_pro_features TEXT[] := ARRAY['marketplace','quantity_simulator','operational_costs','ink_cost','other_materials','coupon_strategy','export_pdf','export_excel','ai_assistant'];
BEGIN
  SELECT plan, trial_ends_at INTO v_plan, v_trial_ends_at FROM public.profiles WHERE user_id = p_user_id;
  IF v_plan IS NULL THEN RETURN json_build_object('allowed', false, 'reason', 'user_not_found'); END IF;
  IF v_plan = 'pro' THEN RETURN json_build_object('allowed', true, 'plan', 'pro'); END IF;
  v_is_trial_active := v_trial_ends_at IS NOT NULL AND v_trial_ends_at > NOW();
  IF p_feature = ANY(v_pro_features) THEN
    IF v_is_trial_active THEN RETURN json_build_object('allowed', true, 'plan', 'trial', 'trial_ends_at', v_trial_ends_at);
    ELSE RETURN json_build_object('allowed', false, 'reason', 'pro_feature_blocked', 'required_plan', 'pro'); END IF;
  END IF;
  IF v_is_trial_active THEN RETURN json_build_object('allowed', true, 'plan', 'trial');
  ELSE RETURN json_build_object('allowed', false, 'reason', 'trial_expired'); END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(p_identifier text, p_action_type text, p_max_requests integer DEFAULT 60, p_window_seconds integer DEFAULT 60)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_rate_limit RECORD; v_now TIMESTAMPTZ := NOW(); v_window_start TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_rate_limit FROM public.rate_limits WHERE identifier = p_identifier AND action_type = p_action_type;
  IF v_rate_limit.blocked_until IS NOT NULL AND v_rate_limit.blocked_until > v_now THEN
    RETURN json_build_object('allowed', false, 'reason', 'rate_limited', 'blocked_until', v_rate_limit.blocked_until, 'retry_after_seconds', EXTRACT(EPOCH FROM (v_rate_limit.blocked_until - v_now))::INTEGER);
  END IF;
  v_window_start := v_now - (p_window_seconds || ' seconds')::INTERVAL;
  IF v_rate_limit.id IS NOT NULL AND v_rate_limit.window_start > v_window_start THEN
    IF v_rate_limit.request_count >= p_max_requests THEN
      UPDATE public.rate_limits SET blocked_until = v_now + INTERVAL '5 minutes' WHERE id = v_rate_limit.id;
      INSERT INTO public.security_logs (event_type, event_description, metadata) VALUES ('rate_limit_exceeded', 'Rate limit exceeded for ' || p_action_type, json_build_object('identifier', p_identifier, 'action', p_action_type));
      RETURN json_build_object('allowed', false, 'reason', 'rate_limited', 'retry_after_seconds', 300);
    ELSE
      UPDATE public.rate_limits SET request_count = request_count + 1 WHERE id = v_rate_limit.id;
      RETURN json_build_object('allowed', true, 'remaining', p_max_requests - v_rate_limit.request_count - 1);
    END IF;
  ELSE
    INSERT INTO public.rate_limits (identifier, action_type, request_count, window_start, blocked_until) VALUES (p_identifier, p_action_type, 1, v_now, NULL)
    ON CONFLICT (identifier, action_type) DO UPDATE SET request_count = 1, window_start = v_now, blocked_until = NULL;
    RETURN json_build_object('allowed', true, 'remaining', p_max_requests - 1);
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN DELETE FROM public.rate_limits WHERE window_start < NOW() - INTERVAL '1 hour'; END; $$;

CREATE OR REPLACE FUNCTION public.check_calculation_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE calc_count integer; max_allowed integer; user_plan text; user_trial_ends_at timestamptz; is_trial_active boolean;
BEGIN
  SELECT p.plan, p.trial_ends_at, sp.max_calculations INTO user_plan, user_trial_ends_at, max_allowed
  FROM public.profiles p LEFT JOIN public.subscription_plans sp ON sp.id = p.plan_id WHERE p.user_id = NEW.user_id;
  IF user_plan = 'pro' THEN
    INSERT INTO public.security_logs (user_id, event_type, event_description) VALUES (NEW.user_id, 'calculation_created', 'Pro user created calculation');
    RETURN NEW;
  END IF;
  is_trial_active := user_trial_ends_at IS NOT NULL AND user_trial_ends_at > NOW();
  IF user_plan = 'free' AND NOT is_trial_active THEN
    INSERT INTO public.security_logs (user_id, event_type, event_description) VALUES (NEW.user_id, 'calculation_blocked', 'Trial expired - calculation blocked');
    RAISE EXCEPTION 'Seu período de teste terminou. Faça upgrade para continuar usando o sistema.';
  END IF;
  SELECT COUNT(*) INTO calc_count FROM public.calculations WHERE user_id = NEW.user_id;
  IF max_allowed IS NULL THEN max_allowed := 2; END IF;
  IF calc_count >= max_allowed THEN
    INSERT INTO public.security_logs (user_id, event_type, event_description) VALUES (NEW.user_id, 'calculation_limit_reached', 'Calculation limit reached: ' || calc_count || '/' || max_allowed);
    RAISE EXCEPTION 'Limite de cálculos atingido. Faça upgrade para continuar.';
  END IF;
  NEW.ink_cost := 0; NEW.other_material_cost := 0; NEW.labor_cost := 0; NEW.energy_cost := 0;
  NEW.equipment_cost := 0; NEW.rent_cost := 0; NEW.other_operational_cost := 0;
  INSERT INTO public.security_logs (user_id, event_type, event_description) VALUES (NEW.user_id, 'calculation_created', 'Trial user created calculation');
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.check_device_fingerprint(p_user_id uuid, p_fingerprint_hash text, p_ip_address text DEFAULT NULL, p_user_agent text DEFAULT NULL)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_existing RECORD; v_suspicious BOOLEAN := false;
BEGIN
  SELECT * INTO v_existing FROM public.device_fingerprints WHERE fingerprint_hash = p_fingerprint_hash AND user_id != p_user_id;
  IF v_existing.id IS NOT NULL THEN
    v_suspicious := true;
    INSERT INTO public.security_logs (user_id, event_type, event_description, ip_address, user_agent, metadata)
    VALUES (p_user_id, 'suspicious_device', 'Device fingerprint already associated with another account', p_ip_address, p_user_agent, json_build_object('existing_user_id', v_existing.user_id, 'fingerprint', LEFT(p_fingerprint_hash, 10)));
  END IF;
  INSERT INTO public.device_fingerprints (user_id, fingerprint_hash, ip_address, user_agent) VALUES (p_user_id, p_fingerprint_hash, p_ip_address, p_user_agent) ON CONFLICT (fingerprint_hash) DO NOTHING;
  RETURN json_build_object('suspicious', v_suspicious, 'registered', true);
END; $$;

CREATE OR REPLACE FUNCTION public.log_security_event(p_user_id uuid, p_event_type text, p_description text, p_ip_address text DEFAULT NULL, p_user_agent text DEFAULT NULL, p_metadata jsonb DEFAULT '{}')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN INSERT INTO public.security_logs (user_id, event_type, event_description, ip_address, user_agent, metadata) VALUES (p_user_id, p_event_type, p_description, p_ip_address, p_user_agent, p_metadata); END; $$;

CREATE OR REPLACE FUNCTION public.log_plan_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF OLD.plan != NEW.plan OR OLD.plan_id IS DISTINCT FROM NEW.plan_id THEN
    INSERT INTO public.security_logs (user_id, event_type, event_description, metadata)
    VALUES (NEW.user_id, 'plan_changed', 'Plan changed from ' || COALESCE(OLD.plan, 'null') || ' to ' || NEW.plan,
      json_build_object('old_plan', OLD.plan, 'new_plan', NEW.plan, 'old_plan_id', OLD.plan_id, 'new_plan_id', NEW.plan_id));
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.confirm_payment_webhook(p_payment_provider_id text, p_user_email text DEFAULT NULL, p_amount numeric DEFAULT NULL)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_pending pending_payments%ROWTYPE; v_user_id uuid;
BEGIN
  IF p_user_email IS NOT NULL THEN
    SELECT p.user_id INTO v_user_id FROM public.profiles p WHERE p.email = p_user_email LIMIT 1;
    IF v_user_id IS NOT NULL THEN
      SELECT * INTO v_pending FROM public.pending_payments WHERE user_id = v_user_id AND status = 'pending' AND expires_at > now() ORDER BY created_at DESC LIMIT 1;
    END IF;
  END IF;
  IF v_pending.id IS NULL THEN
    INSERT INTO public.security_logs (event_type, event_description, metadata) VALUES ('webhook_payment_not_found', 'Webhook received but no matching pending payment found', json_build_object('payment_provider_id', p_payment_provider_id, 'user_email', p_user_email, 'amount', p_amount));
    RETURN json_build_object('success', false, 'error', 'No matching pending payment found');
  END IF;
  UPDATE public.pending_payments SET status = 'confirmed_by_webhook', payment_provider_id = p_payment_provider_id WHERE id = v_pending.id;
  INSERT INTO public.security_logs (user_id, event_type, event_description, metadata) VALUES (v_pending.user_id, 'webhook_payment_confirmed', 'Payment confirmed by InfinitePay webhook', json_build_object('payment_id', v_pending.id, 'payment_provider_id', p_payment_provider_id, 'amount', p_amount));
  RETURN json_build_object('success', true, 'payment_id', v_pending.id, 'user_id', v_pending.user_id);
END; $$;

CREATE OR REPLACE FUNCTION public.verify_and_complete_payment(p_csrf_token text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_pending pending_payments%ROWTYPE; v_lifetime_plan_id uuid;
BEGIN
  SELECT * INTO v_pending FROM public.pending_payments WHERE csrf_token = p_csrf_token AND expires_at > now() LIMIT 1;
  IF v_pending.id IS NULL THEN RETURN json_build_object('success', false, 'error', 'Token inválido ou expirado'); END IF;
  IF v_pending.status != 'confirmed_by_webhook' THEN
    INSERT INTO public.security_logs (user_id, event_type, event_description, metadata) VALUES (v_pending.user_id, 'payment_verification_blocked', 'Payment verification attempted before webhook confirmation', json_build_object('payment_id', v_pending.id, 'status', v_pending.status));
    RETURN json_build_object('success', false, 'error', 'Pagamento ainda não confirmado.', 'status', 'awaiting_confirmation');
  END IF;
  SELECT id INTO v_lifetime_plan_id FROM public.subscription_plans WHERE name = 'lifetime' LIMIT 1;
  UPDATE public.profiles SET plan = 'pro', plan_id = COALESCE(v_lifetime_plan_id, plan_id), updated_at = now() WHERE user_id = v_pending.user_id;
  UPDATE public.pending_payments SET status = 'completed', completed_at = now() WHERE id = v_pending.id;
  INSERT INTO public.security_logs (user_id, event_type, event_description, metadata) VALUES (v_pending.user_id, 'payment_completed', 'User upgraded to pro plan after webhook confirmation', json_build_object('payment_id', v_pending.id, 'payment_provider_id', v_pending.payment_provider_id));
  RETURN json_build_object('success', true, 'message', 'Plano ativado com sucesso');
END; $$;

-- ========== TRIGGERS ==========

CREATE TRIGGER check_calculation_limit_trigger
BEFORE INSERT ON public.calculations FOR EACH ROW EXECUTE FUNCTION public.check_calculation_limit();

CREATE TRIGGER log_plan_change_trigger
BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.log_plan_change();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger on auth.users (criado via dashboard):
-- CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== REVOKE PUBLIC/ANON ==========
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, public;
`;

const AdminExport = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const [loadingTable, setLoadingTable] = useState<string | null>(null);
  const [loadingAll, setLoadingAll] = useState(false);
  const [copied, setCopied] = useState(false);
  const [storageInfo, setStorageInfo] = useState<any[] | null>(null);
  const [loadingStorage, setLoadingStorage] = useState(false);

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Não autenticado');
    return {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    };
  };

  const exportTable = async (tableName: string) => {
    setLoadingTable(tableName);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-data?action=export&table=${tableName}`,
        { headers }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao exportar');
      }

      const csv = await res.text();
      if (!csv.trim()) {
        toast.info(`Tabela "${tableName}" está vazia`);
        return;
      }

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tableName}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`"${tableName}" exportado com sucesso!`);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao exportar tabela');
    } finally {
      setLoadingTable(null);
    }
  };

  const exportAll = async () => {
    setLoadingAll(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-data?action=export-all`,
        { headers }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao exportar');
      }

      const allData = await res.json();

      for (const [table, rows] of Object.entries(allData)) {
        const data = rows as any[];
        if (!data.length) continue;

        const csvHeaders = Object.keys(data[0]);
        const csvRows = [
          csvHeaders.join(','),
          ...data.map((row: any) =>
            csvHeaders
              .map((h) => {
                const val = row[h];
                if (val === null || val === undefined) return '';
                const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
                return `"${str.replace(/"/g, '""')}"`;
              })
              .join(',')
          ),
        ];

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${table}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast.success('Todas as tabelas exportadas!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao exportar');
    } finally {
      setLoadingAll(false);
    }
  };

  const loadStorage = async () => {
    setLoadingStorage(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-data?action=storage`,
        { headers }
      );
      if (!res.ok) throw new Error('Erro ao carregar storage');
      const data = await res.json();
      setStorageInfo(data.storage || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoadingStorage(false);
    }
  };

  const copySQL = () => {
    navigator.clipboard.writeText(SQL_SCHEMAS);
    setCopied(true);
    toast.success('SQL copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div ref={ref} className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Database className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Exportação de Dados</h1>
          <p className="text-muted-foreground">
            Exporte os dados do sistema em CSV ou copie o esquema SQL
          </p>
        </div>

        <Tabs defaultValue="csv" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="csv">📊 Exportar CSV</TabsTrigger>
            <TabsTrigger value="storage">📁 Storage</TabsTrigger>
            <TabsTrigger value="sql">🗃️ Schema SQL</TabsTrigger>
          </TabsList>

          {/* CSV Export Tab */}
          <TabsContent value="csv" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={exportAll} disabled={loadingAll} variant="default" className="gap-2">
                {loadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Exportar Tudo
              </Button>
            </div>

            <div className="grid gap-3">
              {TABLES.map((table) => (
                <Card key={table.name} className="bg-card border-border">
                  <CardContent className="flex items-center justify-between py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <table.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{table.label}</p>
                        <p className="text-sm text-muted-foreground">{table.description}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportTable(table.name)}
                      disabled={loadingTable === table.name}
                      className="gap-2"
                    >
                      {loadingTable === table.name ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      CSV
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Storage Tab */}
          <TabsContent value="storage" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={loadStorage} disabled={loadingStorage} variant="outline" className="gap-2">
                {loadingStorage ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
                Carregar Info Storage
              </Button>
            </div>

            {storageInfo ? (
              <div className="space-y-4">
                {storageInfo.map((bucket: any) => (
                  <Card key={bucket.bucket} className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <HardDrive className="w-5 h-5 text-primary" />
                        {bucket.bucket}
                      </CardTitle>
                      <CardDescription>
                        {bucket.public ? 'Público' : 'Privado'} • {bucket.files?.length || 0} arquivos
                      </CardDescription>
                    </CardHeader>
                    {bucket.files?.length > 0 && (
                      <CardContent>
                        <div className="max-h-48 overflow-y-auto text-sm space-y-1">
                          {bucket.files.map((file: any, i: number) => (
                            <div key={i} className="flex justify-between text-muted-foreground py-1 border-b border-border/50">
                              <span>{file.name}</span>
                              <span>{file.metadata?.size ? `${(file.metadata.size / 1024).toFixed(1)} KB` : '-'}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
                {storageInfo.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Nenhum bucket encontrado</p>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Clique em "Carregar Info Storage" para ver os buckets e arquivos
              </p>
            )}
          </TabsContent>

          {/* SQL Schema Tab */}
          <TabsContent value="sql" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={copySQL} variant="outline" className="gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado!' : 'Copiar SQL'}
              </Button>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <pre className="p-6 text-sm text-foreground overflow-x-auto max-h-[600px] overflow-y-auto font-mono leading-relaxed whitespace-pre-wrap">
                  {SQL_SCHEMAS}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
});

AdminExport.displayName = 'AdminExport';

export default AdminExport;
