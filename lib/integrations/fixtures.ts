import type { RosterAgent, Specialization } from "./airtable/types";

export const FIXTURE_DOMAIN = "example.test";

export const SPECIALIZATIONS: Specialization[] = [
  { id: "spec-pension", name: "פנסיה" },
  { id: "spec-elementary", name: "אלמנטרי" },
  { id: "spec-health", name: "בריאות" },
  { id: "spec-life", name: "ביטוח חיים" },
  { id: "spec-mortgage", name: "משכנתא" },
];

type Seed = [string, string, string, Partial<RosterAgent>?];

const AGENTS: Seed[] = [
  ["דניאל", "לוי", "daniel", { monthlyQuota: 60, dailyQuota: 6, weight: 100, monthlyCount: 2 }],
  ["מיכל", "אברהם", "michal", { monthlyQuota: 50, dailyQuota: 5, weight: 100, monthlyCount: 4 }],
  ["יוסי", "מזרחי", "yossi", { monthlyQuota: 40, dailyQuota: 2, weight: 80, monthlyCount: 3 }],
  ["רונית", "פרץ", "ronit", { monthlyQuota: 60, dailyQuota: 6, weight: 100, monthlyCount: 1, exclusions: { "משכנתא": true } }],
  ["אבי", "ביטון", "avi", { monthlyQuota: 30, dailyQuota: 4, weight: 50, monthlyCount: 2, weightLowered: true }],
  ["שירה", "דהן", "shira", { monthlyQuota: 45, dailyQuota: 5, weight: 100, monthlyCount: 0, trafficLight: "🟡" }],
  ["עומר", "חדד", "omer", { monthlyQuota: 35, dailyQuota: 4, weight: 100, monthlyCount: 35 }],
  ["תמר", "אוחיון", "tamar", { dailyQuota: 5, weight: 100, monthlyCount: 3 }],
  ["גיל", "שלום", "gil", { monthlyQuota: 25, dailyQuota: 3, weight: 100, monthlyCount: 25, exclusions: { "בריאות": true } }],
  ["ליאת", "גבאי", "liat", { monthlyQuota: 50, dailyQuota: 5, weight: 100, monthlyCount: 1, trafficLight: "🔴" }],
  ["אורן", "כץ", "oren", { monthlyQuota: 40, dailyQuota: 4, weight: 100, monthlyCount: 2, exclusions: { "פנסיה": true } }],
  ["נטע", "רוזן", "neta", { monthlyQuota: 40, dailyQuota: 4, weight: 100, monthlyCount: 0 }],
  ["אלון", "ברק", "alon", { monthlyQuota: 30, dailyQuota: 3, weight: 90, monthlyCount: 2 }],
  ["הדר", "נחום", "hadar", { monthlyQuota: 55, dailyQuota: 6, weight: 100, monthlyCount: 5 }],
];

export const ROSTER: RosterAgent[] = AGENTS.map(([firstName, lastName, slug, extra], index) => ({
  id: `recAgent${String(index + 1).padStart(3, "0")}`,
  firstName,
  lastName,
  name: `${firstName} ${lastName}`,
  email: `${slug}@${FIXTURE_DOMAIN}`,
  phone: `05000000${String(index + 1).padStart(2, "0")}`,
  trafficLight: "🟢",
  weightLowered: false,
  monthlyCount: 0,
  exclusions: {},
  ...extra,
}));

export interface FixtureLead {
  number: string;
  id: string;
  customerId: string;
  fullName: string;
  email: string;
  phone: string;
  interestName: string;
  spouseAgentEmail?: string;
}

const LEADS: [string, string, string, string?][] = [
  ["10001", "יעל כהן", "פנסיה"],
  ["10002", "אורי מזרחי", "אלמנטרי"],
  ["10003", "דנה ישראלי", "בריאות"],
  ["10004", "רועי שמש", "ביטוח חיים"],
  ["10005", "מאיה פלד", "פנסיה"],
  ["10006", "איתי רז", "משכנתא"],
  ["10007", "שני גולן", "בריאות"],
  ["10008", "תומר אלון", "פנסיה"],
  ["10009", "לירון בר", "אלמנטרי"],
  ["10010", "ענבר צור", "ביטוח חיים"],
  ["10011", "גלעד שחר", "פנסיה"],
  ["10012", "נועם הראל", "בריאות"],
  ["10013", "קרן לביא", "אלמנטרי"],
  ["10014", "עידו סגל", "פנסיה"],
  ["10015", "רותם דגן", "ביטוח חיים"],
  ["10016", "הילה עמית", "פנסיה"],
  ["10017", "אמיר שגיא", "בריאות"],
  ["10018", "ספיר ניר", "משכנתא"],
  ["10019", "בן אשכנזי", "פנסיה"],
  ["10020", "טל מור", "אלמנטרי"],
];

export const FIXTURE_LEADS: FixtureLead[] = LEADS.map(([number, fullName, interestName], index) => ({
  number,
  id: `lead-${number}`,
  customerId: `cust-${number}`,
  fullName,
  email: `customer${number}@${FIXTURE_DOMAIN}`,
  phone: `05200000${String(index + 1).padStart(2, "0")}`,
  interestName,
}));
