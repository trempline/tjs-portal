-- ============================================
-- TJS MEMBERSHIP MANAGEMENT
-- Phase 1 / TJS-9
-- ============================================

CREATE TABLE IF NOT EXISTS public.tjs_membership_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    expires_at DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    amount NUMERIC(10,2),
    currency TEXT DEFAULT 'EUR',
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT tjs_membership_payments_expiry_check CHECK (expires_at >= payment_date)
);

CREATE INDEX IF NOT EXISTS idx_tjs_membership_payments_profile_id
    ON public.tjs_membership_payments(profile_id);

CREATE INDEX IF NOT EXISTS idx_tjs_membership_payments_payment_date
    ON public.tjs_membership_payments(payment_date DESC);

ALTER TABLE public.tjs_membership_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage membership payments"
    ON public.tjs_membership_payments
    FOR ALL
    USING (
        tjs_is_admin(auth.uid())
        OR tjs_has_role(auth.uid(), 'Committee Member')
    )
    WITH CHECK (
        tjs_is_admin(auth.uid())
        OR tjs_has_role(auth.uid(), 'Committee Member')
    );

CREATE POLICY "Users view own membership payments"
    ON public.tjs_membership_payments
    FOR SELECT
    USING (profile_id = auth.uid());

CREATE OR REPLACE FUNCTION public.tjs_touch_membership_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tjs_membership_payments_updated_at ON public.tjs_membership_payments;
CREATE TRIGGER trg_tjs_membership_payments_updated_at
    BEFORE UPDATE ON public.tjs_membership_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.tjs_touch_membership_payment_updated_at();

CREATE OR REPLACE FUNCTION public.tjs_sync_membership_expiries()
RETURNS INTEGER AS $$
DECLARE
    v_member_role_id UUID;
    v_expired_count INTEGER;
BEGIN
    SELECT id
    INTO v_member_role_id
    FROM public.tjs_roles
    WHERE name = 'Member'
    LIMIT 1;

    WITH expired_profiles AS (
        SELECT id
        FROM public.tjs_profiles
        WHERE is_member = TRUE
          AND member_until IS NOT NULL
          AND member_until < CURRENT_DATE
    ),
    updated_profiles AS (
        UPDATE public.tjs_profiles p
        SET is_member = FALSE,
            updated_at = NOW()
        WHERE p.id IN (SELECT id FROM expired_profiles)
        RETURNING p.id
    ),
    updated_roles AS (
        UPDATE public.tjs_user_roles ur
        SET is_active = FALSE
        WHERE v_member_role_id IS NOT NULL
          AND ur.role_id = v_member_role_id
          AND ur.user_id IN (SELECT id FROM updated_profiles)
        RETURNING ur.user_id
    )
    SELECT COUNT(*)
    INTO v_expired_count
    FROM updated_profiles;

    RETURN COALESCE(v_expired_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.tjs_membership_payments IS 'Manual payment ledger used by the TJS Admin backoffice to activate and renew memberships.';
COMMENT ON FUNCTION public.tjs_sync_membership_expiries() IS 'Expires memberships whose member_until date is before the current date. Schedule daily with your DB job runner.';
