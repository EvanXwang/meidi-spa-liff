alter table users           enable row level security;
alter table wallet          enable row level security;
alter table course_balance  enable row level security;
alter table bookings        enable row level security;
alter table point_logs      enable row level security;
alter table services        enable row level security;
alter table therapists      enable row level security;

create policy "anyone reads services"   on services   for select using (true);
create policy "anyone reads therapists" on therapists for select using (true);

create policy "user reads own"          on users          for select using (id = auth.uid());
create policy "user reads own wallet"   on wallet         for select using (user_id = auth.uid());
create policy "user reads own courses"  on course_balance for select using (user_id = auth.uid());
create policy "user reads own bookings" on bookings       for select using (user_id = auth.uid());
create policy "user reads own logs"     on point_logs     for select using (user_id = auth.uid());
