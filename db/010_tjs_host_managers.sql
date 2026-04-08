-- ============================================
-- TJS HOST MANAGERS (Junction Table)
-- Links Host Managers to assigned Hosts
-- This is the authoritative table for Host Manager assignments
-- ============================================

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tjs_host_managers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID NOT NULL REFERENCES public.tjs_hosts(id) ON DELETE CASCADE,
    manager_id UUID NOT NULL REFERENCES public.tjs_profiles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id),  -- Admin who made the assignment
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    UNIQUE(host_id, manager_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tjs_host_managers_host ON public.tjs_host_managers(host_id);
CREATE INDEX IF NOT EXISTS idx_tjs_host_managers_manager ON public.tjs_host_managers(manager_id);
CREATE INDEX IF NOT EXISTS idx_tjs_host_managers_assigned_by ON public.tjs_host_managers(assigned_by);

-- Enable Row Level Security
ALTER TABLE public.tjs_host_managers ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Admins can do everything
CREATE POLICY "Admins can do everything on host_managers"
    ON public.tjs_host_managers
    FOR ALL
    USING (tjs_is_admin(auth.uid()))
    WITH CHECK (tjs_is_admin(auth.uid()));

-- Host Managers can view their own assignments
CREATE POLICY "Host Managers can view their assigned hosts"
    ON public.tjs_host_managers
    FOR SELECT
    USING (
        manager_id = auth.uid() 
        AND is_active = TRUE
        AND EXISTS (
            SELECT 1 FROM tjs_user_roles ur
            JOIN tjs_roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid() 
            AND ur.is_active = TRUE 
            AND r.name = 'Host Manager'
        )
    );

-- Only admins can insert/update/delete assignments
-- (Host Managers cannot assign/unassign themselves)

COMMENT ON TABLE public.tjs_host_managers IS 'Junction table linking Host Managers to their assigned Hosts. Created by Admins to delegate host management responsibilities.';
COMMENT ON COLUMN public.tjs_host_managers.host_id IS 'Reference to the host being managed';
COMMENT ON COLUMN public.tjs_host_managers.manager_id IS 'Reference to the Host Manager profile';
COMMENT ON COLUMN public.tjs_host_managers.assigned_by IS 'Reference to the Admin who made the assignment';