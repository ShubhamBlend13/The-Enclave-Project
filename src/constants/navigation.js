import { USER_ROLES } from "./roles";

// Navigation is driven by role so the shell does not contain permission logic.
const RESIDENT_NAV_ITEMS = [
    {
        id: "home",
        icon: "⌂",
        label: "Home",
    },
    {
        id: "report",
        icon: "＋",
        label: "Report",
    },
    {
        id: "issues",
        icon: "☰",
        label: "Issues",
    },
    {
        id: "upkeep",
        icon: "✓",
        label: "Upkeep",
    },
    {
        id: "more",
        icon: "◎",
        label: "More",
    },
];

const UPKEEP_MANAGER_NAV_ITEMS = [
    {
        id: "issues",
        icon: "☰",
        label: "Issues",
    },
    {
        id: "report",
        icon: "＋",
        label: "Report",
    },
    {
        id: "upkeep",
        icon: "✓",
        label: "Upkeep",
    },
];

export function getNavigationItems(profile) {
    // The upkeep manager lands in the operational workflow and does not need Home.
    if (profile?.role === USER_ROLES.UPKEEP_MANAGER) {
        return UPKEEP_MANAGER_NAV_ITEMS;
    }

    // Owner, villa admin and residents currently share the main application tabs.
    // Owner-specific management navigation will be added with the user-management flow.
    return RESIDENT_NAV_ITEMS;
}