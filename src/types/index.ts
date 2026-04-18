export interface Service {
  id: string;
  name: string;
  category: 'spa' | 'product';
  duration: number;      // minutes
  price: number;         // TWD
  description: string | null;
  image_url: string | null;
  display_order: number;
}

export interface Therapist {
  id: string;
  name: string;
  title: string | null;
  picture_url: string | null;
  display_order: number;
}

export interface Booking {
  id: string;
  user_id: string;
  service_id: string;
  therapist_id: string | null;
  scheduled_start: string;   // ISO 8601
  scheduled_end: string;
  status: 'booked' | 'checked_in' | 'cancelled';
  checked_in_at: string | null;
  created_at: string;
}

export interface UserProfile {
  id: string;
  line_user_id: string;
  display_name: string | null;
  picture_url: string | null;
}

export interface Wallet {
  user_id: string;
  storage_value: number;
  points: number;
}

export interface CourseBalance {
  id: string;
  user_id: string;
  service_id: string;
  remaining: number;
}
