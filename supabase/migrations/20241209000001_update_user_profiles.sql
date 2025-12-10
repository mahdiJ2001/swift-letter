-- Update user_profiles table: remove about_me_summary columns and add credits column
ALTER TABLE public.user_profiles 
DROP COLUMN IF EXISTS about_me_summary,
DROP COLUMN IF EXISTS about_me_summary_updated_at;

-- Add credits column with default value if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='credits') THEN
        ALTER TABLE public.user_profiles ADD COLUMN credits integer NOT NULL DEFAULT 5;
    END IF;
END $$;

-- Add comment for the credits column
COMMENT ON COLUMN public.user_profiles.credits IS 'Number of credits available for generating cover letters';