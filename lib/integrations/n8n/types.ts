export interface ValidatedLead {
  number: string;
  id: string;
  customerId: string;
  fullName: string;
  email?: string;
  phone?: string;
  interestName?: string;
}

export type ShowAs = "free" | "workingElsewhere" | "tentative" | "busy" | "oof" | "unknown";

export interface CalendarEvent {
  eventId: string;
  start: string;
  end: string;
  showAs: ShowAs;
}

export interface AgentCalendar {
  agentEmail: string;
  readable: boolean;
  events: CalendarEvent[];
  meetingsPerDay: Record<string, number>;
}

export interface BookingPayload {
  bookingId: string;
  agentEmail: string;
  agentName: string;
  agentPhone?: string;
  start: string;
  end: string;
  leadNumber: string;
  leadId?: string;
  customerId?: string;
  interestName?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  additionalLeadNumber?: string;
  additionalCustomerName?: string;
  additionalCustomerEmail?: string;
  additionalCustomerPhone?: string;
  inPersonAddress?: string;
  forced: boolean;
  source: "staff" | "link";
  bookedByEmail?: string;
  outlookEventId?: string;
  surenseMeetingId?: string;
}

export interface CreatedEvent {
  outlookEventId: string;
  surenseMeetingId: string;
  teamsJoinUrl?: string;
}

export type CancelledBy = "customer" | "agent" | "coordinator";

export const CANCEL_TAGS: Record<CancelledBy, string> = {
  customer: 'בוטל ע"י לקוח',
  agent: 'בוטל ע"י הסוכן',
  coordinator: 'בוטל ע"י המתאמת',
};

export interface N8n {
  validateLeads(numbers: string[]): Promise<ValidatedLead[]>;
  spouseAgent(leadId: string): Promise<{ agentEmail: string } | null>;
  readCalendars(agentEmails: string[], from: string, to: string): Promise<AgentCalendar[]>;
  bookingCreated(payload: BookingPayload): Promise<CreatedEvent>;
  bookingRescheduled(payload: BookingPayload & { previousStart: string }): Promise<void>;
  bookingCancelled(payload: BookingPayload & { cancelledBy: CancelledBy; tag: string; reason?: string }): Promise<void>;
  bookingTransferred(payload: BookingPayload & { previousAgentEmail: string; previousOutlookEventId?: string }): Promise<CreatedEvent>;
  customerEmailChanged(payload: BookingPayload & { which: "primary" | "additional"; previousEmail?: string }): Promise<void>;
  agentEmailChanged(payload: { previousEmail: string; newEmail: string; agentName: string; futureBookings: BookingPayload[] }): Promise<CreatedEvent[]>;
  sendCalendarLink(payload: { agentEmail: string; agentName: string }): Promise<void>;
  sendAccountLink(payload: { to: string; name: string; link: string; kind: "invite" | "reinvite" }): Promise<void>;
  sendAlertEmail(payload: { kind: string; agentName?: string }): Promise<void>;
}

export class IntegrationError extends Error {
  constructor(event: string) {
    super(`Integration call failed: ${event}`);
    this.name = "IntegrationError";
  }
}
