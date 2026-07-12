export const USER_ROLES = {
  OWNER_ADMIN: "owner_admin",
  VILLA_ADMIN: "villa_admin",
  RESIDENT: "resident",
  UPKEEP_MANAGER: "upkeep_manager",
};

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

export function canManageUpkeep(profile) {
  return (
    isOwnerAdmin(profile) ||
    isUpkeepManager(profile)
  );
}

export function canViewCommunity(profile) {
  // Community content is family-facing and hidden from operational employees.
  return !isUpkeepManager(profile);
}