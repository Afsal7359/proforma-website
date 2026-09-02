export type Role = "admin" | "tutor" | "client";

export type ClientStatus = "lead" | "active" | "paused" | "alumni";
export type SubStatus = "none" | "trial" | "active" | "expired" | "cancelled";
export type BillingCycle = "monthly" | "annual";
export type PaymentStatus = "paid" | "pending" | "failed" | "refunded";
export type TrialStatus =
  | "upcoming"
  | "open"
  | "closed"
  | "completed"
  | "cancelled";
export type RegistrationStatus =
  | "registered"
  | "confirmed"
  | "attended"
  | "selected"
  | "not_selected"
  | "cancelled"
  | "no_show";
export type AssignmentStatus =
  | "assigned"
  | "in_progress"
  | "completed"
  | "paused";
export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export type AppUser = {
  id: string;
  role: Role;
  login_id: string;
  password_hash: string;
  initial_password: string | null;
  must_change_password: boolean;
  full_name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
};

export type Tutor = {
  id: string;
  user_id: string;
  specialization: string | null;
  positions: string[] | null;
  experience_years: number | null;
  bio: string | null;
  photo_url: string | null;
  city: string | null;
  is_active: boolean;
  created_at: string;
};

export type TutorWithUser = Tutor & {
  user?: Pick<
    AppUser,
    "full_name" | "login_id" | "email" | "phone" | "is_active" | "last_login_at"
  > | null;
};

export type Plan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_annual: number;
  annual_note: string | null;
  features: string[];
  badge: string | null;
  is_featured: boolean;
  cta_label: string | null;
  sort_order: number;
  is_active: boolean;
};

export type Client = {
  id: string;
  user_id: string | null;
  full_name: string;
  date_of_birth: string | null;
  age: number | null;
  position: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  photo_url: string | null;
  tutor_id: string | null;
  plan_id: string | null;
  subscription_status: SubStatus;
  subscription_start: string | null;
  subscription_end: string | null;
  status: ClientStatus;
  height_cm: number | null;
  weight_kg: number | null;
  goal: string | null;
  notes: string | null;
  joined_on: string;
  created_at: string;
};

export type ClientOverview = Client & {
  login_id: string | null;
  login_active: boolean | null;
  last_login_at: string | null;
  tutor_name: string | null;
  plan_name: string | null;
  total_paid: number;
  last_payment_on: string | null;
  speed: number | null;
  stamina: number | null;
  technique: number | null;
  strength: number | null;
  agility: number | null;
  last_progress_on: string | null;
};

export type Subscription = {
  id: string;
  client_id: string;
  plan_id: string | null;
  plan_name: string | null;
  cycle: BillingCycle;
  amount: number;
  status: SubStatus;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  created_at: string;
};

export type Payment = {
  id: string;
  client_id: string;
  subscription_id: string | null;
  amount: number;
  currency: string;
  method: string;
  status: PaymentStatus;
  paid_on: string;
  period_start: string | null;
  period_end: string | null;
  reference: string | null;
  invoice_no: string | null;
  notes: string | null;
  created_at: string;
};

export type Trial = {
  id: string;
  city: string;
  state: string | null;
  venue: string | null;
  address: string | null;
  trial_date: string;
  trial_time: string | null;
  age_group: string | null;
  tag: string | null;
  total_slots: number;
  slots_left: number;
  status: TrialStatus;
  description: string | null;
  requirements: string | null;
  is_published: boolean;
  sort_order: number;
};

export type TrialRegistration = {
  id: string;
  trial_id: string;
  client_id: string;
  status: RegistrationStatus;
  score: Record<string, number> | null;
  coach_notes: string | null;
  created_at: string;
};

export type TrainingProgram = {
  id: string;
  title: string;
  position: string | null;
  level: string | null;
  weeks: number | null;
  description: string | null;
  focus_areas: string[] | null;
  is_template: boolean;
};

export type TrainingAssignment = {
  id: string;
  client_id: string;
  tutor_id: string | null;
  program_id: string | null;
  title: string;
  description: string | null;
  sessions_per_week: number | null;
  start_date: string;
  end_date: string | null;
  status: AssignmentStatus;
  progress_pct: number;
  created_at: string;
};

export type TrainingSession = {
  id: string;
  client_id: string;
  tutor_id: string | null;
  assignment_id: string | null;
  session_date: string;
  duration_min: number | null;
  focus: string | null;
  drills: string[];
  attendance: AttendanceStatus;
  coach_rating: number | null;
  notes: string | null;
  video_url: string | null;
  created_at: string;
};

export type ProgressRecord = {
  id: string;
  client_id: string;
  tutor_id: string | null;
  recorded_on: string;
  speed: number | null;
  stamina: number | null;
  technique: number | null;
  strength: number | null;
  agility: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  notes: string | null;
};

export type Video = {
  id: string;
  title: string;
  category: string | null;
  duration_min: number | null;
  thumbnail_url: string | null;
  video_url: string | null;
  description: string | null;
  position_tag: string | null;
  is_new: boolean;
  is_public: boolean;
  sort_order: number;
};

export type Announcement = {
  id: string;
  title: string;
  body: string | null;
  audience: string;
  is_published: boolean;
  created_at: string;
};

export const METRIC_KEYS = [
  "speed",
  "stamina",
  "technique",
  "strength",
  "agility",
] as const;

export type MetricKey = (typeof METRIC_KEYS)[number];
