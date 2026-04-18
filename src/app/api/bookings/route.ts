import { createServiceClient } from '@/lib/supabase';
import { getUserId, ok, err } from '@/lib/api-helpers';
import type { Booking, Service } from '@/types/index';

export async function POST(req: Request): Promise<Response> {
  // 1. Auth
  const userId = getUserId(req);
  if (!userId) {
    return err('Unauthorized', 401);
  }

  // 2. Parse + validate request body
  let body: {
    serviceId?: unknown;
    therapistId?: unknown;
    date?: unknown;
    time?: unknown;
  };

  try {
    body = await req.json();
  } catch {
    return err('Invalid request body', 400);
  }

  const { serviceId, therapistId, date, time } = body;

  if (typeof serviceId !== 'string' || !serviceId) {
    return err('serviceId is required', 400);
  }
  if (typeof date !== 'string' || !date) {
    return err('date is required', 400);
  }
  if (typeof time !== 'string' || !time) {
    return err('time is required', 400);
  }
  // therapistId can be null or a string
  const resolvedTherapistId: string | null =
    therapistId === null || therapistId === undefined
      ? null
      : typeof therapistId === 'string'
        ? therapistId
        : null;

  const supabase = createServiceClient();

  // 3. Look up service to get duration
  const { data: serviceData, error: serviceError } = await supabase
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .single();

  if (serviceError || !serviceData) {
    console.error('[api/bookings] service lookup error:', serviceError);
    return err('Service not found', 404);
  }

  const service = serviceData as Service;

  // 4. Compute scheduled_start and scheduled_end (Taiwan time UTC+8)
  const scheduledStart = new Date(`${date}T${time}+08:00`).toISOString();
  const scheduledEndDate = new Date(scheduledStart);
  scheduledEndDate.setMinutes(scheduledEndDate.getMinutes() + service.duration);
  const scheduledEnd = scheduledEndDate.toISOString();

  // 5. Check for conflicts: user already has a non-cancelled booking at same scheduled_start
  const { data: conflictData, error: conflictError } = await supabase
    .from('bookings')
    .select('id')
    .eq('user_id', userId)
    .eq('scheduled_start', scheduledStart)
    .neq('status', 'cancelled')
    .maybeSingle();

  if (conflictError) {
    console.error('[api/bookings] conflict check error:', conflictError);
    return err('Failed to check conflicts', 500);
  }

  if (conflictData) {
    return err('You already have a booking at this time', 409);
  }

  // 6. Insert booking
  const { data: insertedData, error: insertError } = await supabase
    .from('bookings')
    .insert({
      user_id: userId,
      service_id: serviceId,
      therapist_id: resolvedTherapistId,
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd,
      status: 'booked',
    })
    .select('*')
    .single();

  if (insertError || !insertedData) {
    console.error('[api/bookings] insert error:', insertError);
    return err('Failed to create booking', 500);
  }

  return ok({ booking: insertedData as Booking }, 201);
}
