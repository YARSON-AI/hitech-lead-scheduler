import { z } from "zod";

export const leadNumber = z.string().trim().regex(/^\d{1,20}$/);
export const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const assignmentSchema = {
  mode: z.enum(["auto", "manual", "spouse"]),
  leadNumber,
  agentId: z.string().max(64).optional(),
  specialization: z.string().max(100).optional(),
  spouseLeadNumber: leadNumber.optional(),
};
