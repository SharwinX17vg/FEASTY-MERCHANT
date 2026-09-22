-- FEASTY-MERCHANT
-- Menu Publication Workflow Foundation
-- Safe migration (backward compatible)

-- 1. Add publication status column
ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS publication_status TEXT NOT NULL DEFAULT 'draft';

-- 2. Allow only valid publication states
ALTER TABLE public.menu_items
DROP CONSTRAINT IF EXISTS menu_items_publication_status_check;

ALTER TABLE public.menu_items
ADD CONSTRAINT menu_items_publication_status_check
CHECK (
  publication_status IN (
    'draft',
    'pending_review',
    'approved',
    'published',
    'rejected'
  )
);

-- 3. Add workflow timestamps
ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- 4. Backfill existing records safely
UPDATE public.menu_items
SET publication_status = 'draft'
WHERE publication_status IS NULL;

-- 5. Helpful index for dashboard filtering
CREATE INDEX IF NOT EXISTS idx_menu_items_publication_status
ON public.menu_items(publication_status);