-- Manual stats synchronization script
-- Run this to sync existing data with the stats table

-- First, let's see current stats
SELECT 'Current Stats:' as info, * FROM app_stats;

-- Refresh all stats using the built-in function
SELECT 'Refreshing stats...' as info;
SELECT refresh_app_stats();

-- Show updated stats
SELECT 'Updated Stats:' as info, * FROM app_stats;

-- If you need to manually check data:
SELECT 'Data verification:' as info, 
       (SELECT COUNT(*) FROM user_profiles) as total_users,
       (SELECT COUNT(*) FROM generated_letters) as total_letters,
       (SELECT COUNT(*) FROM user_feedback) as total_feedback;