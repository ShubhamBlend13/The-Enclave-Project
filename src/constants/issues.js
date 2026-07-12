import { THEME } from "./theme";

export const ISSUE_CATEGORIES = [
  {
    id: "electrical",
    label: "Electrical",
    icon: "⚡",
  },
  {
    id: "plumbing",
    label: "Plumbing",
    icon: "🚿",
  },
  {
    id: "automation",
    label: "Home automation",
    icon: "🎛️",
  },
  {
    id: "hvac",
    label: "AC / Ventilation",
    icon: "❄️",
  },
  {
    id: "housekeeping",
    label: "Housekeeping",
    icon: "🧹",
  },
  {
    id: "landscape",
    label: "Garden / Landscape",
    icon: "🌿",
  },
  {
    id: "clubhouse",
    label: "Clubhouse / Amenity",
    icon: "🏊",
  },
  {
    id: "security",
    label: "Security / Gate",
    icon: "🛡️",
  },
  {
    id: "other",
    label: "Something else",
    icon: "📋",
  },
];

export const ISSUE_STATUSES = {
  OPEN: "open",
  PROGRESS: "progress",
  RESOLVED: "resolved",
};

export const ISSUE_STATUS_DISPLAY = {
  [ISSUE_STATUSES.OPEN]: {
    label: "Open",
    color: THEME.amber,
    bg: "#F6EEDC",
  },
  [ISSUE_STATUSES.PROGRESS]: {
    label: "In progress",
    color: THEME.blue,
    bg: "#E3ECF5",
  },
  [ISSUE_STATUSES.RESOLVED]: {
    label: "Resolved",
    color: THEME.ok,
    bg: "#E2EFE7",
  },
};

export const ISSUE_PRIORITIES = [
  "Low",
  "Normal",
  "Urgent",
];

export function getIssueCategory(categoryId) {
  return (
    ISSUE_CATEGORIES.find(
      (category) => category.id === categoryId,
    ) ?? ISSUE_CATEGORIES.at(-1)
  );
}