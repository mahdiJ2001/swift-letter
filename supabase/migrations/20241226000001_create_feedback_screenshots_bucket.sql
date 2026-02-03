-- Create storage bucket for feedback screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('feedback-screenshots', 'feedback-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for feedback screenshots (allow uploads for all users)
CREATE POLICY "Allow feedback screenshot uploads for everyone" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'feedback-screenshots');

-- Create storage policy for feedback screenshots (allow read for service role only)
CREATE POLICY "Allow feedback screenshot read for service role" ON storage.objects
FOR SELECT USING (bucket_id = 'feedback-screenshots');

-- Create storage policy for feedback screenshots (allow delete for service role only)  
CREATE POLICY "Allow feedback screenshot delete for service role" ON storage.objects
FOR DELETE USING (bucket_id = 'feedback-screenshots');