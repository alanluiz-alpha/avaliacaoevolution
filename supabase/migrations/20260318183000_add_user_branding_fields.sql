-- Add per-user branding fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS app_name TEXT NOT NULL DEFAULT 'ALPHA TRAINER',
  ADD COLUMN IF NOT EXISTS subtitle TEXT NOT NULL DEFAULT 'Avaliação Física Profissional',
  ADD COLUMN IF NOT EXISTS primary_color TEXT NOT NULL DEFAULT '175 80% 47%',
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Keep updated_at trigger already handles timestamp updates
