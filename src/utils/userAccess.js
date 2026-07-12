import {
  isOwnerAdmin,
  isVillaAdmin,
  USER_ROLES,
} from "../constants/roles";

export function canManageUser(actor, targetUser) {
  if (!actor || !targetUser) {
    return false;
  }

  // The owner manages villa admins and the upkeep manager.
  if (isOwnerAdmin(actor)) {
    return [
      USER_ROLES.VILLA_ADMIN,
      USER_ROLES.UPKEEP_MANAGER,
    ].includes(targetUser.role);
  }

  // A villa admin manages residents belonging to their own villa only.
  if (isVillaAdmin(actor)) {
    return (
      targetUser.role === USER_ROLES.RESIDENT &&
      targetUser.homeAreaCode === actor.homeAreaCode
    );
  }

  return false;
}

export function canViewUser(actor, targetUser) {
  if (!actor || !targetUser) {
    return false;
  }

  // The owner has an all-user overview.
  if (isOwnerAdmin(actor)) {
    return true;
  }

  if (isVillaAdmin(actor)) {
    return (
      targetUser.role === USER_ROLES.RESIDENT &&
      targetUser.homeAreaCode === actor.homeAreaCode
    );
  }

  return false;
}