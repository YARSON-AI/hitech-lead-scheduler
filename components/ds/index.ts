import type { FC, ReactNode } from "react";
import * as raw from "./ds";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DS = FC<{ children?: ReactNode } & Record<string, any>>;

export const Tooltip = raw.Tooltip as unknown as DS;
export const FieldLabel = raw.FieldLabel as unknown as DS;
export const RadioGroup = raw.RadioGroup as unknown as DS;
export const Card = raw.Card as unknown as DS;
export const SectionHeader = raw.SectionHeader as unknown as DS;
export const SummaryItem = raw.SummaryItem as unknown as DS;
export const Icon = raw.Icon as unknown as DS;
export const Calendar = raw.Calendar as unknown as DS;
export const TimeSlots = raw.TimeSlots as unknown as DS;
export const Tabs = raw.Tabs as unknown as DS;
export const Alert = raw.Alert as unknown as DS;
export const Badge = raw.Badge as unknown as DS;
export const EmptyState = raw.EmptyState as unknown as DS;
export const Pill = raw.Pill as unknown as DS;
export const ProgressSteps = raw.ProgressSteps as unknown as DS;
export const Checkbox = raw.Checkbox as unknown as DS;
export const Table = raw.Table as unknown as DS;
export const IconButton = raw.IconButton as unknown as DS;
export const Dialog = raw.Dialog as unknown as DS;
export const Toast = raw.Toast as unknown as DS;
export const TextInput = raw.TextInput as unknown as DS;
export const ToggleButton = raw.ToggleButton as unknown as DS;
export const PageHeader = raw.PageHeader as unknown as DS;
export const Spinner = raw.Spinner as unknown as DS;
export const Button = raw.Button as unknown as DS;
export const SearchableSelect = raw.SearchableSelect as unknown as DS;
