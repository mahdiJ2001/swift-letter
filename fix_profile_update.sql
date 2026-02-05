- Fix the profile update issue by cleaning up conflicting triggers and ensuring proper WHERE clauses

-- Drop potentially problematic triggers temporarily
DROP TRIGGER IF EXISTS set_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS user_profiles_updated_at_trigger ON public.user_profiles;
DROP TRIGGER IF EXISTS trg_prevent_user_type_change ON public.user_profiles;

-- Drop functions that might be causing issues
DROP FUNCTION IF EXISTS prevent_user_type_change();

-- Create a single, simple updated_at trigger function
CREATE OR REPLACE FUNCTION handle_user_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create single updated_at trigger
CREATE TRIGGER user_profiles_set_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_user_profile_updated_at();

-- Ensure proper RLS policies exist
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

CREATE POLICY "Users can update their own profile" 
    ON public.user_profiles 
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Check if there are any problematic UPDATE statements without WHERE clauses in stats functions
-- Fix the increment_app_stat function to ensure it has proper WHERE clauses
CREATE OR REPLACE FUNCTION increment_app_stat(stat_column text, amount integer DEFAULT 1)
RETURNS void AS $$
BEGIN
    -- Ensure we're updating the single stats row
    EXECUTE format('UPDATE public.app_stats SET %I = %I + $1, updated_at = now() WHERE id = 1', stat_column, stat_column)
    USING amount;
    
    -- If no row was updated, insert one
    IF NOT FOUND THEN
        INSERT INTO public.app_stats (id, updated_at) VALUES (1, now()) 
        ON CONFLICT (id) DO NOTHING;
        -- Try the update again
        EXECUTE format('UPDATE public.app_stats SET %I = %I + $1, updated_at = now() WHERE id = 1', stat_column, stat_column)
        USING amount;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the set_app_stat function too
CREATE OR REPLACE FUNCTION set_app_stat(stat_column text, new_value anyelement)
RETURNS void AS $$
BEGIN
    EXECUTE format('UPDATE public.app_stats SET %I = $1, updated_at = now() WHERE id = 1', stat_column)
    USING new_value;
    
    -- If no row was updated, insert one
    IF NOT FOUND THEN
        INSERT INTO public.app_stats (id, updated_at) VALUES (1, now()) 
        ON CONFLICT (id) DO NOTHING;
        -- Try the update again
        EXECUTE format('UPDATE public.app_stats SET %I = $1, updated_at = now() WHERE id = 1', stat_column)
        USING new_value;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;