// Temporary shared data used only while the Supabase backend is being prepared.
// Keeping it outside the UI makes replacing it with database queries easier later.

export const DEMO_ISSUES = [
  {
    id: "issue-s1-001",
    areaCode: "S1",
    category: "electrical",
    location: "Master bedroom",
    description: "The ceiling light keeps flickering in the evening.",
    priority: "Normal",
    status: "open",
    reportedBy: "Arjun Rao",
    createdAt: "2026-07-12T08:30:00+05:30",
  },
  {
    id: "issue-s1-002",
    areaCode: "S1",
    category: "plumbing",
    location: "Ground floor washroom",
    description: "Water pressure has been unusually low since yesterday.",
    priority: "Urgent",
    status: "progress",
    reportedBy: "Sunil Tenali",
    createdAt: "2026-07-11T17:45:00+05:30",
  },
  {
    id: "issue-club-001",
    areaCode: "CLUBHOUSE",
    category: "clubhouse",
    location: "Swimming pool",
    description: "The pool filtration system is making a loud noise.",
    priority: "Normal",
    status: "open",
    reportedBy: "S2 Villa Admin",
    createdAt: "2026-07-12T09:10:00+05:30",
  },
];

export const DEMO_ANNOUNCEMENTS = [
  {
    id: "announcement-s1-001",
    areaCode: "S1",
    title: "Water tank cleaning",
    body: "Villa S1 water tank cleaning is scheduled for Monday morning.",
    createdBy: "S1 Villa Admin",
    createdAt: "2026-07-11T18:00:00+05:30",
  },
  {
    id: "announcement-club-001",
    areaCode: "CLUBHOUSE",
    title: "Pool maintenance",
    body: "The swimming pool will remain closed tomorrow from 10 AM to 2 PM.",
    createdBy: "S3 Villa Admin",
    createdAt: "2026-07-12T07:30:00+05:30",
  },
];

export const DEMO_UPKEEP_TASKS = [
  {
    id: "upkeep-s1-001",
    areaCode: "S1",
    title: "AC deep service",
    icon: "❄️",
    frequency: "quarterly",
    nextDue: "2026-07-16T09:00:00+05:30",
  },
  {
    id: "upkeep-s1-002",
    areaCode: "S1",
    title: "Water purifier filter check",
    icon: "🚰",
    frequency: "halfyearly",
    nextDue: "2026-08-05T09:00:00+05:30",
  },
  {
    id: "upkeep-club-001",
    areaCode: "CLUBHOUSE",
    title: "Pool filtration service",
    icon: "🏊",
    frequency: "monthly",
    nextDue: "2026-07-14T09:00:00+05:30",
  },
];