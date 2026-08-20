UPDATE public.profiles
SET plan_id = '0d36bc61-3111-40f6-a37b-59e28f020b82',
    plan = 'pro_monthly',
    subscription_status = 'active',
    subscription_current_period_end = now() + interval '1 month',
    subscription_canceled_at = NULL,
    updated_at = now()
WHERE user_id = '495a73b1-a1af-445a-be05-802435286e09';