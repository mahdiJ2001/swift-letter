-- Add writing_style column to user_profiles table
alter table public.user_profiles 
add column if not exists writing_style text null;