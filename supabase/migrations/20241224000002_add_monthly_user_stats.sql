-- ============================================================================
-- Migration: Add Monthly User Statistics
-- Description: Add columns and functions to track users by month
-- ============================================================================

-- Add monthly user tracking columns
ALTER TABLE public.app_stats 
ADD COLUMN IF NOT EXISTS users_last_month integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS users_this_month integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS users_last_week integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS users_this_week integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS users_today integer NOT NULL DEFAULT 0;

-- Add comments for new columns
COMMENT ON COLUMN public.app_stats.users_last_month IS 'Total users who joined in the previous month';
COMMENT ON COLUMN public.app_stats.users_this_month IS 'Total users who joined in the current month';
COMMENT ON COLUMN public.app_stats.users_last_week IS 'Total users who joined in the previous week';
COMMENT ON COLUMN public.app_stats.users_this_week IS 'Total users who joined in the current week';
COMMENT ON COLUMN public.app_stats.users_today IS 'Total users who joined today';

-- ============================================================================
-- Function to calculate users for specific time periods
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_period_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.app_stats 
    SET 
        -- Today's users
        users_today = (
            SELECT COUNT(*)
            FROM public.user_profiles
            WHERE DATE(created_at) = CURRENT_DATE
        ),
        
        -- This week's users (Monday to Sunday)
        users_this_week = (
            SELECT COUNT(*)
            FROM public.user_profiles
            WHERE created_at >= date_trunc('week', CURRENT_DATE)
            AND created_at < date_trunc('week', CURRENT_DATE) + interval '1 week'
        ),
        
        -- Last week's users
        users_last_week = (
            SELECT COUNT(*)
            FROM public.user_profiles
            WHERE created_at >= date_trunc('week', CURRENT_DATE) - interval '1 week'
            AND created_at < date_trunc('week', CURRENT_DATE)
        ),
        
        -- This month's users
        users_this_month = (
            SELECT COUNT(*)
            FROM public.user_profiles
            WHERE created_at >= date_trunc('month', CURRENT_DATE)
            AND created_at < date_trunc('month', CURRENT_DATE) + interval '1 month'
        ),
        
        -- Last month's users
        users_last_month = (
            SELECT COUNT(*)
            FROM public.user_profiles
            WHERE created_at >= date_trunc('month', CURRENT_DATE) - interval '1 month'
            AND created_at < date_trunc('month', CURRENT_DATE)
        );
END;
$$;

-- ============================================================================
-- Update existing trigger function to include period calculations
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_stats_on_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update total user count and timestamp
    UPDATE public.app_stats 
    SET 
        total_users = total_users + 1,
        last_user_registered_at = NOW();
    
    -- Recalculate period-based user stats
    PERFORM public.calculate_period_users();
    
    RETURN NEW;
END;
$$;

-- ============================================================================
-- Create a scheduled function to refresh period stats daily
-- ============================================================================

CREATE OR REPLACE FUNCTION public.refresh_daily_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Recalculate all period-based statistics
    PERFORM public.calculate_period_users();
    
    -- Update letters generated for different periods
    UPDATE public.app_stats 
    SET 
        -- Today's letters
        letters_generated_today = (
            SELECT COUNT(*)
            FROM public.generated_letters
            WHERE DATE(created_at) = CURRENT_DATE
        ),
        
        -- This week's letters
        letters_generated_this_week = (
            SELECT COUNT(*)
            FROM public.generated_letters
            WHERE created_at >= date_trunc('week', CURRENT_DATE)
            AND created_at < date_trunc('week', CURRENT_DATE) + interval '1 week'
        ),
        
        -- This month's letters
        letters_generated_this_month = (
            SELECT COUNT(*)
            FROM public.generated_letters
            WHERE created_at >= date_trunc('month', CURRENT_DATE)
            AND created_at < date_trunc('month', CURRENT_DATE) + interval '1 month'
        );
    
    -- Log the refresh
    RAISE NOTICE 'Daily stats refreshed at %', NOW();
END;
$$;

-- ============================================================================
-- Initialize the new columns with current data
-- ============================================================================

-- Calculate and populate the initial values
SELECT public.calculate_period_users();

-- ============================================================================
-- Grant permissions
-- ============================================================================

-- Allow authenticated users to view stats
GRANT SELECT ON public.app_stats TO authenticated;

-- Allow service role to update stats  
GRANT ALL ON public.app_stats TO service_role;

-- Allow execution of stats functions
GRANT EXECUTE ON FUNCTION public.calculate_period_users() TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_daily_stats() TO service_role;