export const USER_ROLES = {
  OWNER_ADMIN: "owner_admin",
  VILLA_ADMIN: "villa_admin",
  RESIDENT: "resident",
  UPKEEP_MANAGER: "upkeep_manager",
};

export const ROLE_LABELS = {
  [USER_ROLES.OWNER_ADMIN]: "Owner Admin",
  [USER_ROLES.VILLA_ADMIN]: "Villa Admin",
  [USER_ROLES.RESIDENT]: "Resident",
  [USER_ROLES.UPKEEP_MANAGER]: "Staff",
};

export function getRoleLabel(role) {
  return ROLE_LABELS[role] ?? role;
}

export function isOwnerAdmin(profile) {
  return profile?.role === USER_ROLES.OWNER_ADMIN;
}

export function isVillaAdmin(profile) {
  return profile?.role === USER_ROLES.VILLA_ADMIN;
}

export function isResident(profile) {
  return profile?.role === USER_ROLES.RESIDENT;
}

export function isUpkeepManager(profile) {
  return profile?.role === USER_ROLES.UPKEEP_MANAGER;
}

export function canManageResidents(profile) {
  return (
    isOwnerAdmin(profile) ||
    isVillaAdmin(profile)
  );
}

export function canPostAnnouncements(profile) {
  return isVillaAdmin(profile);
}

export function canResolveIssues(profile) {
  return (
    isOwnerAdmin(profile) ||
    isUpkeepManager(profile)
  );
}

const UPKEEP_MANAGING_ROLES = new Set([
  USER_ROLES.OWNER_ADMIN,
  USER_ROLES.VILLA_ADMIN,
  USER_ROLES.RESIDENT,
  USER_ROLES.UPKEEP_MANAGER,
]);

export function canManageUpkeep(profile) {
  return UPKEEP_MANAGING_ROLES.has(
    profile?.role,
  );
}

export function canViewCommunity(profile) {
  // Community content is family-facing and hidden from operational employees.
  return !isUpkeepManager(profile);
}