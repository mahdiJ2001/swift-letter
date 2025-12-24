-- ============================================================================
-- MIGRATION: Fix Stats Tables and Add Automatic Tracking Triggers
-- Date: 2024-12-24
-- Description: 
--   1. Drop duplicate 'stats' table (keep 'app_stats')
--   2. Add new useful columns to app_stats
--   3. Create triggers to automatically track all stats
--   4. Sync existing data to accurate counts
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop duplicate stats table
-- ============================================================================
DROP TABLE IF EXISTS public.stats CASCADE;

-- ============================================================================
-- STEP 2: Add new useful columns to app_stats
-- ============================================================================

-- Add new columns for more comprehensive analytics
ALTER TABLE public.app_stats 
ADD COLUMN IF NOT EXISTS total_pdf_downloads integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_feedback_received integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_resume_uploads integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS letters_generated_today integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS letters_generated_this_week integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS letters_generated_this_month integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS active_users_today integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS active_users_this_week integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS active_users_this_month integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_credits_used integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_letter_generated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_user_registered_at timestamp with time zone;

-- Add comments for new columns
COMMENT ON COLUMN public.app_stats.total_pdf_downloads IS 'Total number of PDF downloads';
COMMENT ON COLUMN public.app_stats.total_feedback_received IS 'Total feedback submissions received';
COMMENT ON COLUMN public.app_stats.total_resume_uploads IS 'Total resume PDF uploads processed';
COMMENT ON COLUMN public.app_stats.letters_generated_today IS 'Letters generated in the current day (UTC)';
COMMENT ON COLUMN public.app_stats.letters_generated_this_week IS 'Letters generated in the current week';
COMMENT ON COLUMN public.app_stats.letters_generated_this_month IS 'Letters generated in the current month';
COMMENT ON COLUMN public.app_stats.active_users_today IS 'Users who generated letters today';
COMMENT ON COLUMN public.app_stats.active_users_this_week IS 'Users who generated letters this week';
COMMENT ON COLUMN public.app_stats.active_users_this_month IS 'Users who generated letters this month';
COMMENT ON COLUMN public.app_stats.total_credits_used IS 'Total credits consumed across all users';
COMMENT ON COLUMN public.app_stats.last_letter_generated_at IS 'Timestamp of most recent letter generation';
COMMENT ON COLUMN public.app_stats.last_user_registered_at IS 'Timestamp of most recent user registration';

-- ============================================================================
-- STEP 3: Create helper functions for stats updates
-- ============================================================================

-- Function to increment a stat by a given amount
CREATE OR REPLACE FUNCTION increment_app_stat(stat_column text, amount integer DEFAULT 1)
RETURNS void AS $$
BEGIN
    EXECUTE format('UPDATE public.app_stats SET %I = %I + $1, updated_at = now()', stat_column, stat_column)
    USING amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set a stat to a specific value
CREATE OR REPLACE FUNCTION set_app_stat(stat_column text, new_value anyelement)
RETURNS void AS $$
BEGIN
    EXECUTE format('UPDATE public.app_stats SET %I = $1, updated_at = now()', stat_column)
    USING new_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to recalculate average letters per user
CREATE OR REPLACE FUNCTION recalculate_average_letters_per_user()
RETURNS void AS $$
DECLARE
    total_letters integer;
    total_users integer;
    avg_value numeric(10,2);
BEGIN
    SELECT COUNT(*) INTO total_letters FROM public.generated_letters;
    SELECT COUNT(*) INTO total_users FROM public.user_profiles;
    
    IF total_users > 0 THEN
        avg_value := ROUND(total_letters::numeric / total_users::numeric, 2);
    ELSE
        avg_value := 0.00;
    END IF;
    
    UPDATE public.app_stats 
    SET average_generated_letters_per_user = avg_value,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 4: Create triggers for automatic stat tracking
-- ============================================================================

-- Trigger function: When a new user profile is created
CREATE OR REPLACE FUNCTION on_user_profile_created()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.app_stats 
    SET total_users = total_users + 1,
        last_user_registered_at = now(),
        updated_at = now();
    
    PERFORM recalculate_average_letters_per_user();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function: When a user profile is deleted
CREATE OR REPLACE FUNCTION on_user_profile_deleted()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.app_stats 
    SET total_users = GREATEST(total_users - 1, 0),
        updated_at = now();
    
    PERFORM recalculate_average_letters_per_user();
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function: When a new letter is generated
CREATE OR REPLACE FUNCTION on_letter_generated()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.app_stats 
    SET total_generated_letters = total_generated_letters + 1,
        successful_letter_compilations = successful_letter_compilations + 1,
        last_letter_generated_at = now(),
        updated_at = now();
    
    PERFORM recalculate_average_letters_per_user();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function: When a letter is deleted
CREATE OR REPLACE FUNCTION on_letter_deleted()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.app_stats 
    SET total_generated_letters = GREATEST(total_generated_letters - 1, 0),
        updated_at = now();
    
    PERFORM recalculate_average_letters_per_user();
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function: When feedback is submitted
CREATE OR REPLACE FUNCTION on_feedback_submitted()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.app_stats 
    SET total_feedback_received = total_feedback_received + 1,
        updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: Create the triggers
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trg_user_profile_created ON public.user_profiles;
DROP TRIGGER IF EXISTS trg_user_profile_deleted ON public.user_profiles;
DROP TRIGGER IF EXISTS trg_letter_generated ON public.generated_letters;
DROP TRIGGER IF EXISTS trg_letter_deleted ON public.generated_letters;
DROP TRIGGER IF EXISTS trg_feedback_submitted ON public.user_feedback;

-- Create triggers for user_profiles
CREATE TRIGGER trg_user_profile_created
    AFTER INSERT ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION on_user_profile_created();

CREATE TRIGGER trg_user_profile_deleted
    AFTER DELETE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION on_user_profile_deleted();

-- Create triggers for generated_letters
CREATE TRIGGER trg_letter_generated
    AFTER INSERT ON public.generated_letters
    FOR EACH ROW
    EXECUTE FUNCTION on_letter_generated();

CREATE TRIGGER trg_letter_deleted
    AFTER DELETE ON public.generated_letters
    FOR EACH ROW
    EXECUTE FUNCTION on_letter_deleted();

-- Create trigger for user_feedback
CREATE TRIGGER trg_feedback_submitted
    AFTER INSERT ON public.user_feedback
    FOR EACH ROW
    EXECUTE FUNCTION on_feedback_submitted();

-- ============================================================================
-- STEP 6: Sync existing data to accurate counts
-- ============================================================================

-- Update app_stats with current accurate counts from existing data
UPDATE public.app_stats SET
    total_users = (SELECT COUNT(*) FROM public.user_profiles),
    total_generated_letters = (SELECT COUNT(*) FROM public.generated_letters),
    successful_letter_compilations = (SELECT COUNT(*) FROM public.generated_letters),
    total_feedback_received = (SELECT COUNT(*) FROM public.user_feedback),
    average_generated_letters_per_user = CASE 
        WHEN (SELECT COUNT(*) FROM public.user_profiles) > 0 
        THEN ROUND((SELECT COUNT(*) FROM public.generated_letters)::numeric / (SELECT COUNT(*) FROM public.user_profiles)::numeric, 2)
        ELSE 0.00 
    END,
    last_letter_generated_at = (SELECT MAX(created_at) FROM public.generated_letters),
    last_user_registered_at = (SELECT MAX(created_at) FROM public.user_profiles),
    updated_at = now();

-- ============================================================================
-- STEP 7: Create a function to manually refresh stats (useful for admin)
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_app_stats()
RETURNS void AS $$
BEGIN
    UPDATE public.app_stats SET
        total_users = (SELECT COUNT(*) FROM public.user_profiles),
        total_generated_letters = (SELECT COUNT(*) FROM public.generated_letters),
        successful_letter_compilations = (SELECT COUNT(*) FROM public.generated_letters),
        total_feedback_received = (SELECT COUNT(*) FROM public.user_feedback),
        average_generated_letters_per_user = CASE 
            WHEN (SELECT COUNT(*) FROM public.user_profiles) > 0 
            THEN ROUND((SELECT COUNT(*) FROM public.generated_letters)::numeric / (SELECT COUNT(*) FROM public.user_profiles)::numeric, 2)
            ELSE 0.00 
        END,
        last_letter_generated_at = (SELECT MAX(created_at) FROM public.generated_letters),
        last_user_registered_at = (SELECT MAX(created_at) FROM public.user_profiles),
        -- Reset time-based counters (these would be updated by a cron job ideally)
        letters_generated_today = (
            SELECT COUNT(*) FROM public.generated_letters 
            WHERE created_at >= CURRENT_DATE
        ),
        letters_generated_this_week = (
            SELECT COUNT(*) FROM public.generated_letters 
            WHERE created_at >= date_trunc('week', CURRENT_DATE)
        ),
        letters_generated_this_month = (
            SELECT COUNT(*) FROM public.generated_letters 
            WHERE created_at >= date_trunc('month', CURRENT_DATE)
        ),
        active_users_today = (
            SELECT COUNT(DISTINCT user_id) FROM public.generated_letters 
            WHERE created_at >= CURRENT_DATE
        ),
        active_users_this_week = (
            SELECT COUNT(DISTINCT user_id) FROM public.generated_letters 
            WHERE created_at >= date_trunc('week', CURRENT_DATE)
        ),
        active_users_this_month = (
            SELECT COUNT(DISTINCT user_id) FROM public.generated_letters 
            WHERE created_at >= date_trunc('month', CURRENT_DATE)
        ),
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the refresh function to sync all stats
SELECT refresh_app_stats();

-- ============================================================================
-- STEP 8: Update RLS policies for app_stats
-- ============================================================================

-- Enable RLS on app_stats
ALTER TABLE public.app_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "App stats are viewable by everyone" ON public.app_stats;
DROP POLICY IF EXISTS "Only service role can update stats" ON public.app_stats;

-- Create new policies
CREATE POLICY "App stats are viewable by everyone" 
    ON public.app_stats FOR SELECT 
    USING (true);

-- Note: Updates are done via SECURITY DEFINER functions, so no direct update policy needed for users

-- ============================================================================
-- STEP 9: Grant necessary permissions
-- ============================================================================

-- Grant execute permission on stats functions to authenticated users
GRANT EXECUTE ON FUNCTION refresh_app_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_average_letters_per_user() TO authenticated;

-- ============================================================================
-- DONE! Stats will now automatically update when:
-- - New user registers (total_users++)
-- - User is deleted (total_users--)
-- - Letter is generated (total_generated_letters++, successful_letter_compilations++)
-- - Letter is deleted (total_generated_letters--)
-- - Feedback is submitted (total_feedback_received++)
-- 
-- To manually refresh all stats, run: SELECT refresh_app_stats();
-- ============================================================================
