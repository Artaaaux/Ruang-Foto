-- ============================================================================
-- RuangFoto — Supabase PostgreSQL Schema & Otomasi Penghapusan 1x24 Jam
-- Sesuai PRD RuangFoto Bagian 10, 11, dan 12
-- Jalankan skrip ini di Supabase Dashboard -> SQL Editor -> New Query
-- ============================================================================

create extension if not exists "uuid-ossp";

-- 1. Tabel Users (Profil pengguna yang terhubung dengan Supabase Auth)
create table if not exists public.users (
  id text primary key,
  name text not null,
  email text unique not null,
  login_method text not null default 'email' check (login_method in ('google', 'email')),
  verified boolean not null default false,
  avatar_color text not null default '#FFE066',
  created_at timestamptz not null default now()
);

-- Trigger sinkronisasi otomatis dari auth.users ke public.users
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_name text;
  v_method text;
  v_color text;
  v_colors text[] := array['#FFE066', '#A78BFA', '#36CFC0', '#F59E5B', '#FFC9C4', '#3BA7D9'];
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    'Pengguna'
  );
  v_method := case
    when new.raw_app_meta_data->>'provider' = 'google' then 'google'
    else 'email'
  end;
  v_color := coalesce(
    new.raw_user_meta_data->>'avatar_color',
    v_colors[1 + floor(random() * array_length(v_colors, 1))::int]
  );

  insert into public.users (id, name, email, login_method, verified, avatar_color, created_at)
  values (
    new.id::text,
    v_name,
    new.email,
    v_method,
    (new.email_confirmed_at is not null or v_method = 'google'),
    v_color,
    coalesce(new.created_at, now())
  )
  on conflict (id) do update
    set name = excluded.name,
        email = excluded.email,
        verified = excluded.verified;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- 2. Tabel Templates (Template gratis photostrip)
create table if not exists public.templates (
  id text primary key,
  name text not null,
  category text not null check (category in ('Retro', 'Romantis', 'Ceria', 'Minimalis')),
  pose_count int not null check (pose_count between 2 and 6),
  layout_config jsonb not null,
  frame_color text not null default '#FFFFFF',
  accent_color text not null default '#FFE066',
  is_free boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3. Tabel Sessions (Ruang sesi photobooth maksimal 2 peserta: host & guest)
create table if not exists public.sessions (
  id text primary key default ('ses_' || replace(uuid_generate_v4()::text, '-', '')),
  code text unique not null,
  template_id text not null references public.templates(id),
  host_id text not null,
  host_name text not null,
  host_avatar_color text not null default '#FFE066',
  guest_id text,
  guest_name text,
  guest_avatar_color text,
  status text not null default 'menunggu' check (status in ('menunggu', 'berjalan', 'selesai', 'kedaluwarsa')),
  host_ready boolean not null default false,
  guest_ready boolean not null default false,
  host_mic_on boolean not null default true,
  host_cam_on boolean not null default true,
  guest_mic_on boolean not null default true,
  guest_cam_on boolean not null default true,
  current_pose int not null default 1,
  countdown_started_at bigint,
  poses jsonb not null default '[]'::jsonb,
  result_id text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '15 minutes')
);

create index if not exists idx_sessions_code on public.sessions(code);
create index if not exists idx_sessions_expires_at on public.sessions(expires_at);

-- 4. Tabel Photos (Foto tiap pose dari kamera lokal, kedaluwarsa 1x24 jam)
create table if not exists public.photos (
  id text primary key default ('pho_' || replace(uuid_generate_v4()::text, '-', '')),
  session_id text not null references public.sessions(id) on delete cascade,
  session_code text not null,
  pose_number int not null,
  owner_role text not null check (owner_role in ('host', 'guest')),
  owner_id text,
  storage_path text not null,
  public_url text,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  unique (session_id, pose_number, owner_role)
);

create index if not exists idx_photos_session_id on public.photos(session_id);
create index if not exists idx_photos_expires_at on public.photos(expires_at);

-- 5. Tabel Results (Hasil gabungan photostrip HD 1080p, kedaluwarsa 1x24 jam)
create table if not exists public.results (
  id text primary key,
  session_id text unique not null references public.sessions(id) on delete cascade,
  session_code text not null,
  template_id text not null references public.templates(id),
  host_id text not null,
  host_name text not null,
  guest_id text,
  guest_name text,
  poses jsonb not null default '[]'::jsonb,
  image_url text not null default '',
  composite_data_url text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create index if not exists idx_results_session_code on public.results(session_code);
create index if not exists idx_results_expires_at on public.results(expires_at);

-- 6. Tabel Signals (Antrean sinyal WebRTC P2P & sinkronisasi sesi)
create table if not exists public.signals (
  id text primary key,
  session_code text not null,
  sender_id text not null,
  sender_role text not null check (sender_role in ('host', 'guest')),
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at_ms bigint not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_signals_session_code_ms on public.signals(session_code, created_at_ms);

-- Seed Template Gratis Saat Peluncuran (FR-11)
insert into public.templates (id, name, category, pose_count, layout_config, frame_color, accent_color, is_free)
values
  ('retro-klasik', 'Retro Klasik 90s', 'Retro', 4, '{"orientation":"vertical","width":1080,"height":2880,"pairMode":"side-by-side"}', '#FFFFFF', '#FFE066', true),
  ('romantis-senja', 'Romantis Beda Kota', 'Romantis', 3, '{"orientation":"vertical","width":1080,"height":2320,"pairMode":"side-by-side"}', '#FFC9C4', '#FF5C5C', true),
  ('ceria-pop', 'Ceria Akhir Pekan', 'Ceria', 4, '{"orientation":"vertical","width":1080,"height":2880,"pairMode":"side-by-side"}', '#FFE066', '#36CFC0', true),
  ('frame-ceria-kawaii', 'Ceria Super Cute', 'Ceria', 4, '{"orientation":"vertical","width":1080,"height":1622,"pairMode":"side-by-side","frameSrc":"/templates/frame-ceria-kawaii.png"}', '#FFFFFF', '#36CFC0', true),
  ('frame-minimalis-momen', 'Minimalis Momen Jauh', 'Minimalis', 3, '{"orientation":"vertical","width":1080,"height":2160,"pairMode":"shared-frame","frameSrc":"/templates/frame-minimalis-momen.png"}', '#FFFFFF', '#FFE066', true),
  ('frame-ceria-sunbeam', 'Ceria Sunbeam', 'Ceria', 4, '{"orientation":"vertical","width":1080,"height":2016,"pairMode":"side-by-side","frameSrc":"/templates/frame-ceria-sunbeam.png"}', '#FFE066', '#36CFC0', true),
  ('frame-minimalis-cream', 'Minimalis Cream', 'Minimalis', 3, '{"orientation":"vertical","width":1080,"height":1640,"pairMode":"side-by-side","frameSrc":"/templates/frame-minimalis-cream.png"}', '#FFFFFF', '#FFE066', true),
  ('frame-retro-koral', 'Retro Koral', 'Retro', 3, '{"orientation":"vertical","width":1080,"height":1640,"pairMode":"side-by-side","frameSrc":"/templates/frame-retro-koral.png"}', '#FFF3EA', '#FF5C5C', true),
  ('frame-romantis-blush', 'Romantis Blush', 'Romantis', 3, '{"orientation":"vertical","width":1080,"height":1640,"pairMode":"side-by-side","frameSrc":"/templates/frame-romantis-blush.png"}', '#FFC9C4', '#FF5C5C', true),
  ('frame-romantis-berdua', 'Romantis Berdua', 'Romantis', 3, '{"orientation":"vertical","width":1080,"height":2160,"pairMode":"shared-frame","frameSrc":"/templates/frame-romantis-berdua.png"}', '#FFC9C4', '#A78BFA', true)
on conflict (id) do update
  set name = excluded.name,
      category = excluded.category,
      pose_count = excluded.pose_count,
      layout_config = excluded.layout_config,
      frame_color = excluded.frame_color,
      accent_color = excluded.accent_color,
      is_free = excluded.is_free;

-- Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.templates enable row level security;
alter table public.sessions enable row level security;
alter table public.photos enable row level security;
alter table public.results enable row level security;
alter table public.signals enable row level security;

drop policy if exists "Templates dapat dilihat semua pengguna" on public.templates;
create policy "Templates dapat dilihat semua pengguna" on public.templates
  for select using (true);

drop policy if exists "Pengguna melihat dan mengubah profil sendiri" on public.users;
create policy "Pengguna melihat dan mengubah profil sendiri" on public.users
  for all using (auth.uid()::text = id);

drop policy if exists "Peserta sesi dapat mengakses sesi" on public.sessions;
create policy "Peserta sesi dapat mengakses sesi" on public.sessions
  for all using (auth.uid()::text = host_id or auth.uid()::text = guest_id or status = 'menunggu');

drop policy if exists "Peserta sesi dapat mengelola foto sesi" on public.photos;
create policy "Peserta sesi dapat mengelola foto sesi" on public.photos
  for all using (
    exists (
      select 1 from public.sessions s
      where s.id = photos.session_id
      and (s.host_id = auth.uid()::text or s.guest_id = auth.uid()::text)
    )
  );

drop policy if exists "Host dan Guest dapat melihat hasil sebelum kedaluwarsa" on public.results;
create policy "Host dan Guest dapat melihat hasil sebelum kedaluwarsa" on public.results
  for select using (
    (host_id = auth.uid()::text or guest_id = auth.uid()::text)
    and expires_at > now()
  );

drop policy if exists "Peserta sesi dapat bertukar sinyal" on public.signals;
create policy "Peserta sesi dapat bertukar sinyal" on public.signals
  for all using (true);

-- Fungsi pembersihan otomatis 1x24 jam (FR-10) & sesi menganggur > 15 menit (NFR-03)
create or replace function public.cleanup_expired_ruangfoto_data()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.results where expires_at <= now();
  delete from public.photos where expires_at <= now();
  delete from public.signals where created_at <= (now() - interval '15 minutes');
  update public.sessions
    set status = 'kedaluwarsa'
    where status in ('menunggu', 'berjalan')
      and expires_at <= now();
end;
$$;
