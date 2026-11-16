export interface BookingRow {
  id: string;
  agent_email: string;
  agent_name: string;
  start_at: string;
  end_at: string;
  status: "confirmed" | "cancelled" | "failed";
  profile: "regular" | "spouse";
  lead_number: string;
  lead_id: string | null;
  customer_id: string | null;
  interest_name: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  additional_lead_number: string | null;
  additional_customer_name: string | null;
  additional_customer_email: string | null;
  additional_customer_phone: string | null;
  in_person_address: string | null;
  notes: string | null;
  spouse_booking_id: string | null;
  forced: boolean;
  source: "staff" | "link";
  link_id: string | null;
  assignment_mode: "auto" | "manual" | "spouse";
  assignment_reason: Record<string, unknown> | null;
  booked_by: string | null;
  booked_by_name: string | null;
  outlook_event_id: string | null;
  surense_meeting_id: string | null;
  teams_join_url: string | null;
  cancelled_by: "customer" | "agent" | "coordinator" | null;
  cancelled_by_name: string | null;
  cancel_reason: string | null;
  cancelled_at: string | null;
  created_at: string;
}

export interface BookingEvent {
  id: number;
  booking_id: string | null;
  action: string;
  actor_name: string | null;
  actor_role: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  created_at: string;
}
