CREATE OR REPLACE FUNCTION check_in_booking(p_booking_id uuid, p_user_id uuid)
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking  bookings%ROWTYPE;
  v_points   int;
BEGIN
  -- 1. Fetch and validate booking
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'check_in_not_found';
  END IF;

  IF v_booking.status = 'checked_in' THEN
    RAISE EXCEPTION 'check_in_already_done';
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RAISE EXCEPTION 'check_in_cancelled';
  END IF;

  -- Check if now() is within ±2 hours of scheduled_start
  IF now() < v_booking.scheduled_start - interval '2 hours' OR
     now() > v_booking.scheduled_start + interval '2 hours' THEN
    RAISE EXCEPTION 'check_in_time_invalid: too early or too late to check in';
  END IF;

  -- 2. Update booking status
  UPDATE bookings
  SET status = 'checked_in', checked_in_at = now()
  WHERE id = p_booking_id;

  -- 3. Award points
  UPDATE wallet
  SET points = points + 10, updated_at = now()
  WHERE user_id = p_user_id;

  -- 4. Log point award
  INSERT INTO point_logs (user_id, delta, reason, booking_id)
  VALUES (p_user_id, 10, 'check_in', p_booking_id);

  -- 5. Return new points total
  SELECT points INTO v_points
  FROM wallet
  WHERE user_id = p_user_id;

  RETURN v_points;
END;
$$;
