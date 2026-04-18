CREATE OR REPLACE FUNCTION init_new_user(p_user_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service1_id   uuid;
  v_service1_dur  int;
  v_service2_id   uuid;
  v_therapist1_id uuid;
  v_sched_start   timestamptz;
  v_sched_end     timestamptz;
BEGIN
  -- 1. Seed wallet
  INSERT INTO wallet (user_id, storage_value, points)
  VALUES (p_user_id, 12500, 8)
  ON CONFLICT (user_id) DO NOTHING;

  -- 2. Fetch first 2 services by display_order
  SELECT id, duration INTO v_service1_id, v_service1_dur
  FROM services
  ORDER BY display_order ASC
  LIMIT 1;

  IF v_service1_id IS NULL THEN
    RAISE EXCEPTION 'init_new_user: no services found (display_order=1)';
  END IF;

  SELECT id INTO v_service2_id
  FROM services
  ORDER BY display_order ASC
  LIMIT 1 OFFSET 1;

  -- 3. Seed course_balance for both services
  INSERT INTO course_balance (user_id, service_id, remaining)
  VALUES (p_user_id, v_service1_id, 5)
  ON CONFLICT (user_id, service_id) DO NOTHING;

  INSERT INTO course_balance (user_id, service_id, remaining)
  VALUES (p_user_id, v_service2_id, 2)
  ON CONFLICT (user_id, service_id) DO NOTHING;

  -- 4. Fetch first therapist by display_order
  SELECT id INTO v_therapist1_id
  FROM therapists
  ORDER BY display_order ASC
  LIMIT 1;

  IF v_therapist1_id IS NULL THEN
    RAISE EXCEPTION 'init_new_user: no therapists found';
  END IF;

  -- 5. Compute scheduled_start: 5 days from today at 02:00 UTC (= 10:00 UTC+8)
  v_sched_start := (now()::date + interval '5 days' + interval '2 hours');
  v_sched_end   := v_sched_start + (v_service1_dur * interval '1 minute');

  -- 6. Seed mock upcoming booking
  INSERT INTO bookings (user_id, service_id, therapist_id, scheduled_start, scheduled_end, status)
  VALUES (p_user_id, v_service1_id, v_therapist1_id, v_sched_start, v_sched_end, 'booked')
  ON CONFLICT (user_id, scheduled_start) DO NOTHING;
END;
$$;
