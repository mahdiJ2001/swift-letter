-- Update generated_letters table: remove job_title, company_name, and pdf_url columns
DO $$ 
BEGIN 
    -- Drop columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='generated_letters' AND column_name='job_title') THEN
        ALTER TABLE public.generated_letters DROP COLUMN job_title;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='generated_letters' AND column_name='company_name') THEN
        ALTER TABLE public.generated_letters DROP COLUMN company_name;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='generated_letters' AND column_name='pdf_url') THEN
        ALTER TABLE public.generated_letters DROP COLUMN pdf_url;
    END IF;
END $$;

-- Add comment for the updated table
COMMENT ON TABLE public.generated_letters IS 'Stores generated cover letters without job title, company name, or PDF URL';