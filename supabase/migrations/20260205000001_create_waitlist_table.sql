-- Create waitlist table to store emails of users who joined the waitlist
CREATE TABLE public.waitlist (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL UNIQUE,
    joined_at timestamp with time zone DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    source text DEFAULT 'website',
    status text DEFAULT 'active' CHECK (status IN ('active', 'notified', 'converted')),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at timestamp with time zone DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (join waitlist)
CREATE POLICY "Anyone can join waitlist" ON public.waitlist
    FOR INSERT WITH CHECK (true);

-- Create policy for admins to view waitlist (you can customize this)
CREATE POLICY "Service role can view waitlist" ON public.waitlist
    FOR ALL USING (auth.role() = 'service_role');

-- Create index for faster email lookups
CREATE INDEX idx_waitlist_email ON public.waitlist(email);
CREATE INDEX idx_waitlist_joined_at ON public.waitlist(joined_at DESC);
CREATE INDEX idx_waitlist_status ON public.waitlist(status);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.waitlist
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();