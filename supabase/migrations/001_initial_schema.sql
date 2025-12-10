-- Create updated user_profiles table with credits column
create table if not exists public.user_profiles (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  full_name text not null,
  email text not null,
  phone text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  links text null,
  experiences text not null,
  projects text not null,
  skills text not null,
  education text null,
  certifications text null,
  languages text null,
  location text null,
  user_type character varying(20) null default 'normal'::character varying,
  credits integer null default 0,
  constraint user_profiles_pkey primary key (id),
  constraint user_profiles_user_id_key unique (user_id),
  constraint user_profiles_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint user_profiles_user_type_check check (
    (
      (user_type)::text = any (
        (
          array[
            'normal'::character varying,
            'admin'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

-- Create feedback table
create table if not exists public.user_feedback (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  feedback text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_feedback_pkey primary key (id),
  constraint user_feedback_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete set null
) TABLESPACE pg_default;

-- Create updated generated_letters table (removed job_title, company_name, pdf_url)
create table if not exists public.generated_letters (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  job_description text not null,
  cover_letter text not null,
  created_at timestamp with time zone null default now(),
  constraint generated_letters_pkey primary key (id),
  constraint generated_letters_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

-- Create stats table
create table if not exists public.stats (
  id uuid not null default gen_random_uuid (),
  total_users integer not null default 0,
  total_generated_letters integer not null default 0,
  successful_compilations integer not null default 0,
  failed_compilations integer not null default 0,
  average_letters_per_user numeric(10,2) not null default 0.00,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint stats_pkey primary key (id)
) TABLESPACE pg_default;

-- Create indexes for better performance
create index if not exists idx_user_feedback_user_id on public.user_feedback using btree (user_id) TABLESPACE pg_default;
create index if not exists idx_user_feedback_created_at on public.user_feedback using btree (created_at desc) TABLESPACE pg_default;
create index if not exists idx_generated_letters_user_id on public.generated_letters using btree (user_id) TABLESPACE pg_default;
create index if not exists idx_generated_letters_created_at on public.generated_letters using btree (created_at desc) TABLESPACE pg_default;

-- Create function to handle updated_at automatically
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create function to prevent user_type changes
create or replace function prevent_user_type_change()
returns trigger as $$
begin
  if old.user_type != new.user_type and old.user_type is not null then
    raise exception 'user_type cannot be changed once set';
  end if;
  return new;
end;
$$ language plpgsql;

-- Create function for updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for user_profiles
create trigger set_updated_at 
  before update on user_profiles 
  for each row 
  execute function handle_updated_at();

create trigger trg_prevent_user_type_change 
  before update on user_profiles 
  for each row 
  execute function prevent_user_type_change();

create trigger user_profiles_updated_at_trigger 
  before update on user_profiles 
  for each row 
  execute function update_updated_at_column();

-- Enable Row Level Security
alter table public.user_profiles enable row level security;
alter table public.user_feedback enable row level security;
alter table public.generated_letters enable row level security;
alter table public.stats enable row level security;

-- Create RLS policies
-- User profiles: users can only see and edit their own profile
create policy "Users can view their own profile" on public.user_profiles
  for select using (auth.uid() = user_id);

create policy "Users can insert their own profile" on public.user_profiles
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own profile" on public.user_profiles
  for update using (auth.uid() = user_id);

-- Generated letters: users can only see their own letters
create policy "Users can view their own letters" on public.generated_letters
  for select using (auth.uid() = user_id);

create policy "Users can insert their own letters" on public.generated_letters
  for insert with check (auth.uid() = user_id);

-- Feedback: users can insert feedback and view their own
create policy "Users can insert feedback" on public.user_feedback
  for insert with check (auth.uid() = user_id or user_id is null);

create policy "Users can view their own feedback" on public.user_feedback
  for select using (auth.uid() = user_id or user_id is null);

-- Stats: read-only for everyone
create policy "Stats are viewable by everyone" on public.stats
  for select using (true);

-- Insert initial stats record
insert into public.stats (total_users, total_generated_letters, successful_compilations, failed_compilations, average_letters_per_user)
values (0, 0, 0, 0, 0.00)
on conflict do nothing;