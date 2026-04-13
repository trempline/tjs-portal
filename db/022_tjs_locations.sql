-- ============================================================
-- TJS-22: Host Manager Public Locations
-- Dedicated TJS-prefixed location tables for host-manager CRUD.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tjs_locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    address text,
    lat double precision,
    long double precision,
    description text,
    is_public boolean NOT NULL DEFAULT false,
    is_private boolean NOT NULL DEFAULT false,
    public_description text,
    restricted_description text,
    capacity text,
    city text,
    country text,
    zip text,
    phone text,
    email text,
    website text,
    is_active boolean NOT NULL DEFAULT true,
    access_info text,
    created_by uuid REFERENCES public.tjs_profiles(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES public.tjs_profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tjs_location_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id uuid NOT NULL REFERENCES public.tjs_locations(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (location_id, sort_order)
);

CREATE TABLE IF NOT EXISTS public.tjs_location_amenities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id uuid NOT NULL REFERENCES public.tjs_locations(id) ON DELETE CASCADE,
    amenity_id integer NOT NULL REFERENCES public.sys_location_amenity(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (location_id, amenity_id)
);

CREATE TABLE IF NOT EXISTS public.tjs_location_specs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id uuid NOT NULL REFERENCES public.tjs_locations(id) ON DELETE CASCADE,
    spec_id integer NOT NULL REFERENCES public.sys_location_specs(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (location_id, spec_id)
);

CREATE TABLE IF NOT EXISTS public.tjs_location_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id uuid NOT NULL UNIQUE REFERENCES public.tjs_locations(id) ON DELETE CASCADE,
    location_type_id integer NOT NULL REFERENCES public.sys_location_types(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tjs_locations_visibility ON public.tjs_locations (is_public, is_private, is_active);
CREATE INDEX IF NOT EXISTS idx_tjs_locations_created_by ON public.tjs_locations (created_by);
CREATE INDEX IF NOT EXISTS idx_tjs_location_images_location_id ON public.tjs_location_images (location_id);
CREATE INDEX IF NOT EXISTS idx_tjs_location_amenities_location_id ON public.tjs_location_amenities (location_id);
CREATE INDEX IF NOT EXISTS idx_tjs_location_specs_location_id ON public.tjs_location_specs (location_id);

ALTER TABLE public.tjs_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tjs_location_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tjs_location_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tjs_location_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tjs_location_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own tjs locations" ON public.tjs_locations;
CREATE POLICY "Users manage own tjs locations"
ON public.tjs_locations
FOR ALL
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users manage own tjs location images" ON public.tjs_location_images;
CREATE POLICY "Users manage own tjs location images"
ON public.tjs_location_images
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.tjs_locations l
        WHERE l.id = tjs_location_images.location_id
          AND l.created_by = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.tjs_locations l
        WHERE l.id = tjs_location_images.location_id
          AND l.created_by = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users manage own tjs location amenities" ON public.tjs_location_amenities;
CREATE POLICY "Users manage own tjs location amenities"
ON public.tjs_location_amenities
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.tjs_locations l
        WHERE l.id = tjs_location_amenities.location_id
          AND l.created_by = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.tjs_locations l
        WHERE l.id = tjs_location_amenities.location_id
          AND l.created_by = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users manage own tjs location specs" ON public.tjs_location_specs;
CREATE POLICY "Users manage own tjs location specs"
ON public.tjs_location_specs
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.tjs_locations l
        WHERE l.id = tjs_location_specs.location_id
          AND l.created_by = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.tjs_locations l
        WHERE l.id = tjs_location_specs.location_id
          AND l.created_by = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users manage own tjs location types" ON public.tjs_location_types;
CREATE POLICY "Users manage own tjs location types"
ON public.tjs_location_types
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.tjs_locations l
        WHERE l.id = tjs_location_types.location_id
          AND l.created_by = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.tjs_locations l
        WHERE l.id = tjs_location_types.location_id
          AND l.created_by = auth.uid()
    )
);
