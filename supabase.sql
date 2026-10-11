-- Supabase > SQL Editor > New query: tamamını yapıştır ve Run.

-- 1) Kullanıcı profilleri
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'username', ''), split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

alter table public.profiles enable row level security;
drop policy if exists "profil oku" on public.profiles;
create policy "profil oku" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
-- Kullanıcıların profil yazma izni yok: kimse kendini admin yapamaz.

-- 2) Bildirimler
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  username text,
  observer_name text not null check (char_length(observer_name) between 2 and 100),
  observed_at timestamptz not null,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  address text check (char_length(address) <= 300),
  photo_path text not null,
  vegetation text not null check (vegetation in ('low','mid','high')),
  risks text[] not null default '{}',
  access_score int not null check (access_score between 1 and 5),
  notes text check (char_length(notes) <= 1000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

drop policy if exists "bildirim oku" on public.reports;
create policy "bildirim oku" on public.reports
  for select using (status = 'approved' or user_id = auth.uid() or public.is_admin());

drop policy if exists "bildirim ekle" on public.reports;
create policy "bildirim ekle" on public.reports
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "bildirim guncelle" on public.reports;
create policy "bildirim guncelle" on public.reports
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "bildirim sil" on public.reports;
create policy "bildirim sil" on public.reports
  for delete to authenticated using (public.is_admin());

-- 3) Fotoğraf deposu
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-photos', 'report-photos', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "foto oku" on storage.objects;
create policy "foto oku" on storage.objects
  for select using (bucket_id = 'report-photos');

drop policy if exists "foto yukle" on storage.objects;
create policy "foto yukle" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'report-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "foto sil" on storage.objects;
create policy "foto sil" on storage.objects
  for delete to authenticated
  using (bucket_id = 'report-photos' and public.is_admin());

-- 4) Kendini yönetici yap: önce siteden normal kayıt ol, sonra bunu çalıştır.
-- update public.profiles set is_admin = true where email = 'SENIN_EPOSTAN@ornek.com';
