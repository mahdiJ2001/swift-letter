-- Create contacts table for contact form submissions
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- Add RLS (Row Level Security) policies
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (submit contact form)
CREATE POLICY "Anyone can submit contact messages" ON contacts
    FOR INSERT WITH CHECK (true);

-- Only authenticated users (admins) can read contact messages
CREATE POLICY "Only authenticated users can read contacts" ON contacts
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_contacts_updated_at();