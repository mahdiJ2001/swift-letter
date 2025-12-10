-- Create stats table for application metrics
CREATE TABLE public.app_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  total_generated_letters integer NOT NULL DEFAULT 0,
  total_users integer NOT NULL DEFAULT 0,
  successful_letter_compilations integer NOT NULL DEFAULT 0,
  failed_letter_compilations integer NOT NULL DEFAULT 0,
  average_generated_letters_per_user numeric(10,2) NOT NULL DEFAULT 0.00,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT app_stats_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Create trigger for updated_at
CREATE TRIGGER app_stats_updated_at_trigger 
  BEFORE UPDATE ON public.app_stats 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial stats record
INSERT INTO public.app_stats (
  total_generated_letters, 
  total_users, 
  successful_letter_compilations, 
  failed_letter_compilations, 
  average_generated_letters_per_user
) VALUES (0, 0, 0, 0, 0.00);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_app_stats_created_at 
  ON public.app_stats USING btree (created_at DESC) 
  TABLESPACE pg_default;

-- Add comments
COMMENT ON TABLE public.app_stats IS 'Application statistics tracking total users, generated letters, and success metrics';
COMMENT ON COLUMN public.app_stats.total_generated_letters IS 'Total number of cover letters generated';
COMMENT ON COLUMN public.app_stats.total_users IS 'Total number of registered users';
COMMENT ON COLUMN public.app_stats.successful_letter_compilations IS 'Number of successful letter generations';
COMMENT ON COLUMN public.app_stats.failed_letter_compilations IS 'Number of failed letter generations';
COMMENT ON COLUMN public.app_stats.average_generated_letters_per_user IS 'Average letters generated per user';