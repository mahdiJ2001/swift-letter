-- ============================================================================
-- FIX: Add WHERE clause to all app_stats UPDATE functions
-- Problem: UPDATE statements without WHERE clause cause errors
-- Solution: Target the single row in app_stats using id = 1
-- ============================================================================

-- First, ensure app_stats table has exactly one row with a fixed UUID
INSERT INTO public.app_stats (id, total_users, total_generated_letters, successful_letter_compilations, failed_letter_compilations, average_generated_letters_per_user)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 0, 0, 0, 0, 0.00)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Fix helper functions
-- ============================================================================

-- Fix increment_app_stat function
CREATE OR REPLACE FUNCTION increment_app_stat(stat_column text, amount integer DEFAULT 1)
RETURNS void AS $$
BEGIN
    EXECUTE format('UPDATE public.app_stats SET %I = %I + $1, updated_at = now() WHERE id = ''00000000-0000-0000-0000-000000000001''::uuid', stat_column, stat_column)
    USING amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix set_app_stat function
CREATE OR REPLACE FUNCTION set_app_stat(stat_column text, new_value anyelement)
RETURNS void AS $$
BEGIN
    EXECUTE format('UPDATE public.app_stats SET %I = $1, updated_at = now() WHERE id = ''00000000-0000-0000-0000-000000000001''::uuid', stat_column)
    USING new_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix recalculate_average_letters_per_user function
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
        updated_at = now()
    WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Fix trigger functions - ADD WHERE id = 1 to all UPDATE statements
-- ============================================================================

-- Fix: When a new user profile is created
CREATE OR REPLACE FUNCTION on_user_profile_created()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.app_stats 
    SET total_users = total_users + 1,
        last_user_registered_at = now(),
        updated_at = now()
    WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
    
    PERFORM recalculate_average_letters_per_user();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix: When a user profile is deleted
CREATE OR REPLACE FUNCTION on_user_profile_deleted()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.app_stats 
    SET total_users = GREATEST(total_users - 1, 0),
        updated_at = now()
    WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
    
    PERFORM recalculate_average_letters_per_user();
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix: When a new letter is generated
CREATE OR REPLACE FUNCTION on_letter_generated()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.app_stats 
    SET total_generated_letters = total_generated_letters + 1,
        successful_letter_compilations = successful_letter_compilations + 1,
        last_letter_generated_at = now(),
        updated_at = now()
    WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
    
    PERFORM recalculate_average_letters_per_user();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix: When a letter is deleted
CREATE OR REPLACE FUNCTION on_letter_deleted()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.app_stats 
    SET total_generated_letters = GREATEST(total_generated_letters - 1, 0),
        updated_at = now()
    WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
    
    PERFORM recalculate_average_letters_per_user();
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix: When feedback is submitted
CREATE OR REPLACE FUNCTION on_feedback_submitted()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.app_stats 
    SET total_feedback_received = total_feedback_received + 1,
        updated_at = now()
    WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Fix refresh_app_stats function if it exists
-- ============================================================================
CREATE OR REPLACE FUNCTION refresh_app_stats()
RETURNS void AS $$
DECLARE
    users_count integer;
    letters_count integer;
    feedback_count integer;
    avg_letters numeric(10,2);
BEGIN
    SELECT COUNT(*) INTO users_count FROM public.user_profiles;
    SELECT COUNT(*) INTO letters_count FROM public.generated_letters;
    SELECT COUNT(*) INTO feedback_count FROM public.user_feedback;
    
    IF users_count > 0 THEN
        avg_letters := ROUND(letters_count::numeric / users_count::numeric, 2);
    ELSE
        avg_letters := 0.00;
    END IF;
    
    UPDATE public.app_stats 
    SET total_users = users_count,
        total_generated_letters = letters_count,
        total_feedback_received = feedback_count,
        average_generated_letters_per_user = avg_letters,
        updated_at = now()
    WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Verify the fix
-- ============================================================================
SELECT 'Fix applied successfully!' as status;
SELECT * FROM app_stats WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
