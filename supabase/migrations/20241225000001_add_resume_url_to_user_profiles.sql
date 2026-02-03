-- Add resume_url column to user_profiles table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='resume_url') THEN
        ALTER TABLE public.user_profiles ADD COLUMN resume_url text NULL;
    END IF;
END $$;

-- Add comment for the resume_url column
COMMENT ON COLUMN public.user_profiles.resume_url IS 'URL to the uploaded resume PDF file';