-- Add screenshot_url column to user_feedback table for proper screenshot storage
ALTER TABLE public.user_feedback 
ADD COLUMN screenshot_url text NULL;

-- Add index for faster screenshot-related queries
CREATE INDEX idx_user_feedback_screenshot_url ON public.user_feedback(screenshot_url) 
WHERE screenshot_url IS NOT NULL;

-- Add rating column for structured feedback
ALTER TABLE public.user_feedback 
ADD COLUMN rating integer NULL 
CHECK (rating >= 1 AND rating <= 5);

-- Add index for rating queries
CREATE INDEX idx_user_feedback_rating ON public.user_feedback(rating) 
WHERE rating IS NOT NULL;

-- Add metadata column for additional information
ALTER TABLE public.user_feedback 
ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;

-- Create index on metadata for faster JSON queries
CREATE INDEX idx_user_feedback_metadata ON public.user_feedback USING gin(metadata);

-- Update the updated_at field when feedback is modified
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at updates
DROP TRIGGER IF EXISTS trigger_update_feedback_updated_at ON public.user_feedback;
CREATE TRIGGER trigger_update_feedback_updated_at
    BEFORE UPDATE ON public.user_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_feedback_updated_at();