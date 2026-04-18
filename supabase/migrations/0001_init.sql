create table if not exists users (
  id           uuid primary key default gen_random_uuid(),
  line_user_id text unique not null,
  display_name text,
  picture_url  text,
  created_at   timestamptz default now()
);

create table if not exists wallet (
  user_id        uuid primary key references users(id) on delete cascade,
  storage_value  int  not null default 0,
  points         int  not null default 0,
  updated_at     timestamptz default now()
);

create table if not exists services (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  category      text not null check (category in ('spa', 'product')),
  duration      int  not null,
  price         int  not null,
  description   text,
  image_url     text,
  display_order int default 0
);

create table if not exists therapists (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  title         text,
  picture_url   text,
  display_order int default 0
);

create table if not exists course_balance (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  service_id uuid not null references services(id),
  remaining  int  not null default 0 check (remaining >= 0),
  unique (user_id, service_id)
);

create table if not exists bookings (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  service_id      uuid not null references services(id),
  therapist_id    uuid references therapists(id),
  scheduled_start timestamptz not null,
  scheduled_end   timestamptz not null,
  status          text not null default 'booked'
                  check (status in ('booked', 'checked_in', 'cancelled')),
  checked_in_at   timestamptz,
  created_at      timestamptz default now(),
  unique (user_id, scheduled_start)
);

create table if not exists point_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  delta      int  not null,
  reason     text not null check (reason in ('check_in', 'redeem', 'admin_adjust')),
  booking_id uuid references bookings(id),
  created_at timestamptz default now()
);

create index if not exists idx_bookings_user_status on bookings(user_id, status);
create index if not exists idx_bookings_scheduled_start on bookings(scheduled_start);
create index if not exists idx_point_logs_user on point_logs(user_id, created_at desc);
